const _ = require('lodash');
import cheerio from 'cheerio';
import { IAnalysisPageResults, IPageInfo, IPageResult, ITags } from './models/interfaces';
import puppeteer from 'puppeteer'
import { IRule, IRuleResultMessage } from '../common/models/rule.interfaces';
import { ITesterCompareParams, ITesterBooleanParams } from '../common/models/tester.interfaces';


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

  private getAttributes($: any, search: string): any[] {
    const arr = [];
    $(search).each(function () {
      const namespace = $(this)[0].namespace;
      if (!namespace || namespace.includes('html')) {
        const out = {
          tag: $(this)[0].name,
          innerHTML: $(this).html(),
          innerText: $(this).text(),
        };

        if ($(this)[0].attribs) {
          Object.entries($(this)[0].attribs).forEach((attr) => {
            out[attr[0].toLowerCase()] = attr[1];
          });
        }

        arr.push(out);
      }
    });
    return arr;
  };

  private getSelectedTagsFromHtml(html: string): ITags {
    const $ = cheerio.load(html);
    const result = {
      html: this.getAttributes($, 'html'),
      title: this.getAttributes($, 'title'),
      meta: this.getAttributes($, 'head meta'),
      ldjson: this.getAttributes($, 'script[type="application/ld+json"]'),
      h1s: this.getAttributes($, 'h1'),
      h2s: this.getAttributes($, 'h2'),
      h3s: this.getAttributes($, 'h3'),
      h4s: this.getAttributes($, 'h4'),
      h5s: this.getAttributes($, 'h5'),
      h6s: this.getAttributes($, 'h6'),
      canonical: this.getAttributes($, '[rel="canonical"]'),
      imgs: this.getAttributes($, 'img'),
      aTags: this.getAttributes($, 'a'),
      linkTags: this.getAttributes($, 'link'),
      ps: this.getAttributes($, 'p'),
      body: this.getAttributes($, "body")
    };
    return result;
  }


  private getRuleDeepCopy(rule: IRule) {
    let currentRule: IRule = Object.assign({}, rule);
    currentRule.errors = [];
    currentRule.info = [];
    currentRule.warnings = [];
    return currentRule;
  }

  private async analyzeRule(currentRule: IRule, extractedTags: any, url: string) {
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

  private async getGlobalSEOAnalysis(pageInfo: IPageInfo): Promise<IAnalysisPageResults> {
    try {
      const {html, url} = pageInfo;
      let results: IRule[] = [];
      let pageResults: IAnalysisPageResults = this.getBlankpageResults(url);

      const extractedTags = this.getSelectedTagsFromHtml(html);
      pageResults.tags = extractedTags;

      this.siteWideLinks.set(url, extractedTags.aTags);
      if (extractedTags.title[0] && extractedTags.title[0].innerText)
        this.logTitleTag(url, extractedTags.title[0].innerText, pageResults);

      const metaDescription = extractedTags.meta.find((m) => m.name && m.name.toLowerCase() === 'description');
      if (metaDescription)
        this.logMetaDescription(url, metaDescription.content, pageResults);

      for (let rule of this.rulesToUse) {
        let currentRule = this.getRuleDeepCopy(rule);
        await this.analyzeRule(currentRule, extractedTags, url);
        this.finishRule(currentRule)
        results.push(currentRule);
      }

      pageResults.results = this.formatResults(results);
      return pageResults;
    } catch (err) {
      console.debug("Seo global analysis", err);
      throw err;
    }
  };

  private async getHtmlFromUrl(page: puppeteer.Page): Promise<IPageInfo> {
    try {
      const url = page.url();
      console.debug("Begin - SEO screenshot url: ", url);
      const screenshot = await page.screenshot({ encoding: "base64" }).then(function (data) {
        let base64Encode = `data:image/png;base64,${data}`;
        return base64Encode;
      });
      console.debug("End - SEO screenshot");
      console.debug("Begin - SEO get HTML of url; ", url);
      const html = await page.evaluate(() => document.documentElement.outerHTML);
      console.debug("End - SEO get HTML");
      return { url, html, screenshot };
    }
    catch (err) {
      console.debug(err);
      throw err;
    }
  }

  public async run(page: puppeteer.Page): Promise<IPageResult> {
    console.debug("Begin - SEO Main process");
    const pageInfo = await this.getHtmlFromUrl(page);
    const result = await this.getGlobalSEOAnalysis(pageInfo);
    console.debug("End - SEO Main process");
    return { type:"SEO", result, pageInfo};
  }
};