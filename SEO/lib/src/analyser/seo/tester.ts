import cheerio from 'cheerio';
import { IRuleResultMessage, IRule, IAnalysisPageResults, IRuleParametersComparaisonTest, IRuleParametersForBooleanTest, IPageResults, ISitemapPageDetails, ITags } from './interface';
const _ = require('lodash');
import puppeteer from 'puppeteer'

export const defaultPreferences = {
  internalLinksLowerCase: true,
  internalLinksTrailingSlash: true,
};

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
        test: (params: IRuleParametersComparaisonTest) => {
          try {
            params.assert(params.value1, params.value2);
          }
          catch (ex) {
            currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        },
        trueOrFalse: (params: IRuleParametersForBooleanTest) => {
          try {
            params.assert(params.value);
          }
          catch (ex) {
            currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content, target: params.target });
          }
        },
        lint: (params: IRuleParametersForBooleanTest) => {
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

  private async getGlobalSEOAnalysis(html: string, url: string): Promise<IAnalysisPageResults> {
    try {
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
      console.debug("Seo global anysis", err);
      throw err;
    }
  };

  private getAnchors(html: string): { aTags: any[] } {
    const $ = cheerio.load(html);
    return {
      aTags: this.getAttributes($, 'a'),
    }
  }

  private getLinksFromPage(fetchedData: ISitemapPageDetails): string[] {
    const result: { aTags: any[] } = this.getAnchors(fetchedData.html);
    if (result.aTags && result.aTags.length > 0) {
      const links: string[] = _.uniq(result.aTags.filter(link => link.href).map(link => link.href));
      const internalLinks: string[] = links.filter(link =>
        !link.includes('#') &&
        !link.includes('http') &&
        !link.includes(fetchedData.url) &&
        !link.includes('mailto:') &&
        !link.includes('tel:') &&
        link !== '/').map(item => {
          if (_.startsWith(item, '/'))
            return `${fetchedData.url}${item}`;
        })
      return internalLinks;
    }
  }

  private async computeSitemap(browser: puppeteer.Browser, fetchedData: ISitemapPageDetails): Promise<any[]> {
    let links: ISitemapPageDetails[] = [fetchedData];
    const childLinksToCrawl = this.getLinksFromPage(fetchedData);
    if (childLinksToCrawl) {
      for (const link of childLinksToCrawl) {
        const childrenFetchedData = await this.getHtmlFromUrl(browser, link);
        links.push(childrenFetchedData);
      }
      return _.uniqBy(links, "url");
    }
    return [];
  }

  private async getHtmlFromUrl(browser: puppeteer.Browser, url: string): Promise<ISitemapPageDetails> {
    const page = await browser.newPage();
    await page.goto(url);
    const screenshot = await page.screenshot({ encoding: "base64" }).then(function (data) {
      let base64Encode = `data:image/png;base64,${data}`;
      return base64Encode;
    });
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    return { url, html, screenshot }
  }

  public async run(url: string): Promise<IPageResults> {
    const browser = await puppeteer.launch();
    let globalResults: IPageResults = {
      results: [],
      sitemap: []
    };


    const fetchedResult = await this.getHtmlFromUrl(browser, url);
    globalResults.sitemap = await this.computeSitemap(browser, fetchedResult);

    //Compute Rules
    for (const fetchedData of globalResults.sitemap) {
      let results = await this.getGlobalSEOAnalysis(fetchedData.html, fetchedData.url);
      if (results)
        globalResults.results.push(results);
      fetchedData.html = "";
    }

    /*for (const result of globalResults.results) {
      console.log("****************************************************************************");
      console.log("Seo -> ", result.results);
      //console.log("Tags -> ", result.tags);
      console.log("Url -> ", result.url);
    }*/

    return globalResults;
  }
};
