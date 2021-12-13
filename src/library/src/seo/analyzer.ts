const _ = require('lodash');
import puppeteer from 'puppeteer';
//import cheerio from 'cheerio';
import { IAnalysisPageResults, IPageInfo, IPageResult, ITags } from './models/interfaces';
import { IRule, IRuleResultMessage } from '../common/models/rule.interfaces';
import { ITesterCompareParams, ITesterBooleanParams } from '../common/models/tester.interfaces';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';

function uuid() {
  return "00000000-0000-4000-8000-000000000000".replace(/0/g, function () { return (0 | Math.random() * 16).toString(16) })
}

export class SeoAnalyzer {
  private rulesToUse: IRule[];
  private siteWideLinks: Map<any, any>;
  private titleTags: Map<any, any>;
  private metaDescriptions: Map<any, any>;

  public constructor(private rules: any,
    private host: string) {
    this.rulesToUse = this.rules.length > 0 ? this.rules : []
    this.siteWideLinks = new Map();
    this.titleTags = new Map();
    this.metaDescriptions = new Map();
  }

  private logMetaDescription(url: string, meta: string, siteResults: IAnalysisPageResults) {
    if (this.metaDescriptions.has(meta)) {
      siteResults.duplicateMetaDescriptions.push([this.metaDescriptions.get(meta), url]);
    } else {
      this.metaDescriptions.set(meta, url);
    }
  }

  private logTitleTag(url: string, title: string, siteResults: IAnalysisPageResults) {
    if (this.titleTags.has(title)) {
      siteResults.duplicateTitles.push([this.titleTags.get(title), url]);
    } else {
      this.titleTags.set(title, url);
    }
  }

  private finishRule(currentRule: IRule): void {
    if (currentRule.errors.length === 0 && currentRule.warnings.length === 0)
      currentRule.success = true;
  }

  private async getAttributes(page: puppeteer.Page, search: string): Promise<any[]> {
    const tags = await page.$$eval(search, (elements: Element[]) => {
      return elements.map((element: Element) => {
        const out = {
          tag: element.tagName,
          innerHTML: element.innerHTML,
          innerText: element.textContent,
          attributes: element.getAttributeNames().reduce((obj, name) => ({
            ...obj,
            [name]: element.getAttribute(name)
          }), {})
        };
        // tranform attributes array in properties directly accessible in object structure.
        if (out.attributes) {
          Object.entries(out.attributes).forEach((attr) => {
            out[attr[0].toLowerCase()] = attr[1];
          });
        }

        delete out.attributes
        return out;
      });
    });
    return tags;
  };

  private async getSEOTags(page: puppeteer.Page): Promise<ITags> {
    return {
      html: await this.getAttributes(page, 'html'),
      title: await this.getAttributes(page, 'title'),
      meta: await this.getAttributes(page, 'meta'),
      ldjson: await this.getAttributes(page, 'script[type="application/ld+json"]'),
      h1s: await this.getAttributes(page, 'h1'),
      h2s: await this.getAttributes(page, 'h2'),
      h3s: await this.getAttributes(page, 'h3'),
      h4s: await this.getAttributes(page, 'h4'),
      h5s: await this.getAttributes(page, 'h5'),
      h6s: await this.getAttributes(page, 'h6'),
      canonical: await this.getAttributes(page, '[rel="canonical"]'),
      imgs: await this.getAttributes(page, 'img'),
      aTags: await this.getAttributes(page, 'a'),
      linkTags: await this.getAttributes(page, 'link'),
      ps: await this.getAttributes(page, 'p'),
      body: await this.getAttributes(page, "body")
    };
  }

  private getRuleDeepCopy(rule: IRule) {
    let currentRule: IRule = Object.assign({}, rule);
    currentRule.errors = [];
    currentRule.info = [];
    currentRule.warnings = [];
    return currentRule;
  }

  private async validateSEORule(currentRule: IRule, extractedTags: any, url: string) {
    await currentRule.validator(
      { result: extractedTags, response: { url, host: this.host }, preferences: {} },
      {
        compareTest: (params: ITesterCompareParams) => {
          try {
            params.assert(params.value1, params.value2);
          }
          catch (ex) {
            currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        },
        BooleanTest: (params: ITesterBooleanParams) => {
          try {
            params.assert(params.value);
          }
          catch (ex) {
            currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        },
        BooleanLint: (params: ITesterBooleanParams) => {
          try {
            params.assert(params.value);
          }
          catch (ex) {
            currentRule.warnings.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        }
      },
    )
  }

  private async validateSEORTRule(currentRule: IRule, payload: any) {
    await currentRule.validator(
      { ...payload },
      {
        compareTest: (params: ITesterCompareParams) => {
          try {
            params.assert(params.value1, params.value2);
          }
          catch (ex) {
            currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        },
        BooleanTest: (params: ITesterBooleanParams) => {
          try {
            params.assert(params.value);
          }
          catch (ex) {
            currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        },
        BooleanLint: (params: ITesterBooleanParams) => {
          try {
            params.assert(params.value);
          }
          catch (ex) {
            currentRule.warnings.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        }
      },
    )
  }

  private formatResults(results: IRule[]) {
    const display = ['warnings', 'errors'];
    return display
      .reduce((out, key) => {
        return [
          ...out,
          ...results
            .filter((r) => !r.success)
            .reduce((o, ruleResult) => {
              return [
                ...o,
                ...ruleResult[key]
                  .sort((a: IRuleResultMessage, b: IRuleResultMessage) => a.priority - b.priority)
                  .map((r) => ({ ...r, level: key })),
              ];
            }, [] as IRuleResultMessage[]),
        ];
      }, [] as IRuleResultMessage[]);
  }

  private getBlankpageResults(url: string): IAnalysisPageResults {
    return {
      uid: uuid(),
      url: url,
      results: [],
      duplicateTitles: [],
      duplicateMetaDescriptions: [],
      orphanPages: [],
      brokenInternalLinks: [],
      tags: null
    }
  }

  private async getSEOAnalysis(page: puppeteer.Page, pageInfo: IPageInfo): Promise<IAnalysisPageResults> {
    try {
      console.debug("Begin - SEO get analysis");
      const { url } = pageInfo;
      let results: IRule[] = [];
      let pageResults: IAnalysisPageResults = this.getBlankpageResults(url);

      const extractedTags = await this.getSEOTags(page);
      pageResults.tags = extractedTags;

      this.siteWideLinks.set(url, extractedTags.aTags);
      if (extractedTags.title[0] && extractedTags.title[0].innerText)
        this.logTitleTag(url, extractedTags.title[0].innerText, pageResults);

      const metaDescription = extractedTags.meta.find((m) => m.name && m.name.toLowerCase() === 'description');
      if (metaDescription)
        this.logMetaDescription(url, metaDescription.content, pageResults);

      for (let rule of this.rulesToUse) {
        let currentRule = this.getRuleDeepCopy(rule);
        await this.validateSEORule(currentRule, extractedTags, url);
        this.finishRule(currentRule)
        results.push(currentRule);
      }

      pageResults.results = this.formatResults(results);
      console.debug("End - SEO get analysis");
      return pageResults;
    } catch (err) {
      throw err;
    }
  };

  private async getPageInfo(page: puppeteer.Page): Promise<IPageInfo> {
    try {
      console.debug("Begin - Get PageInfo");
      const url = page.url();
      const screenshot = await page.screenshot({ encoding: "base64" }).then(function (data) {
        let base64Encode = `data:image/png;base64,${data}`;
        console.debug("End - Get PageInfo");
        return base64Encode;
      });
      return { url, screenshot };
    }
    catch (err) {
      throw err;
    }
  }

  private runRealTimeRule = async (payload: any): Promise<any> => {
    let results: any = [];
    const rules = this.rulesToUse.filter(item => item.name === payload.tag);
    if (rules && rules.length > 0) {
      let currentRule = this.getRuleDeepCopy(rules[0]);
      await this.validateSEORTRule(currentRule, payload);
      this.finishRule(currentRule);
      results.push(currentRule);
    }
    return results;
  }

  public async runRealTimeRules(payloads: any): Promise<any> {
    let results: any = [];
    if (!_.isArray(payloads))
      results = await this.runRealTimeRule(payloads);
    else {
      await payloads.forEach(async payload => {
        const result = await this.runRealTimeRule(payload);
        results.push(...result);
      });
    }
    return results;
  }

  public async run(page: puppeteer.Page): Promise<IPageResult> {
    try {
      console.debug("Begin - SEO Main process");
      const pageInfo = await this.getPageInfo(page);
      const seoResult = await this.getSEOAnalysis(page, pageInfo);
      console.debug("End - SEO Main process");
      return { type: "SEO", result: seoResult, pageInfo };
    }
    catch (err) {
      console.debug("Err: SEO Main process", err);
      throw err;
    }
  }
};