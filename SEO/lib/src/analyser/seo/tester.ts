import axios from 'axios';
import cheerio from 'cheerio';
import { render } from 'usus';
import { IMessage, IRule, IAnalyserPageResults, ITesterParameters, ITesterParametersBool, IPageResults, IFetchedPageResults } from './interface';
var _ = require('lodash');
import puppeteer from 'puppeteer'

export const defaultPreferences = {
  internalLinksLowerCase: true,
  internalLinksTrailingSlash: true,
};

type TPair = [string, string];

function uuid() {
  return "00000000-0000-4000-8000-000000000000".replace(/0/g, function () { return (0 | Math.random() * 16).toString(16) })
}

export class SeoTester {
  //private currentRule: IRule;
  private rulesToUse: IRule[];
  private internalLinks: TPair[];
  private pagesSeen: Set<string>;
  private siteWideLinks: Map<any, any>;
  private titleTags: Map<any, any>;
  private metaDescriptions: Map<any, any>;
  private crawledUrls: string[] = [];

  public constructor(private rules: any,
    private host: string) {
    this.rulesToUse = this.rules.length > 0 ? this.rules : []
    this.internalLinks = [];
    this.siteWideLinks = new Map();
    this.titleTags = new Map();
    this.metaDescriptions = new Map();
    this.pagesSeen = new Set();
  }

  private logMetaDescription(url: string, meta: string, siteResults: IAnalyserPageResults) {
    if (this.metaDescriptions.has(meta)) {
      siteResults.duplicateMetaDescriptions.push([this.metaDescriptions.get(meta), url]);
    } else {
      this.metaDescriptions.set(meta, url);
    }
  }

  private logTitleTag(url: string, title: string, siteResults: IAnalyserPageResults) {
    if (this.titleTags.has(title)) {
      siteResults.duplicateTitles.push([this.titleTags.get(title), url]);
    } else {
      this.titleTags.set(title, url);
    }
  }

  private noEmptyRule(currentRule: IRule) {
    if (!currentRule.name || currentRule.name.length === 0) throw Error('No current test name');
    if (!currentRule.description || currentRule.description.length === 0)
      throw Error('No current test description');
  }

  private finishRule(currentRule: IRule): void {
    if (currentRule.errors.length === 0 && currentRule.warnings.length === 0)
      currentRule.success = true;
  }

  private getAttributes($: any, search: string) {
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

  private getTags(html: string): any {
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
    };
    return result;
  }

  private async test(html: string, url: string): Promise<IAnalyserPageResults> {
    try {
      this.pagesSeen.add(url);
      let results: IRule[] = [];

      let pageResults: IAnalyserPageResults = {
        uid: uuid(),
        url: url,
        results: [],
        duplicateTitles: [],
        duplicateMetaDescriptions: [],
        orphanPages: [],
        brokenInternalLinks: [],
        tags: []
      }

      const extractedTags = this.getTags(html);
      pageResults.tags = extractedTags;
      // SPA detection
      // TODO make a better detection
      if (extractedTags.h1s.length === 0 && extractedTags.h2s.length === 0 && extractedTags.h3s.length === 0 && extractedTags.imgs.length === 0)
        return null;

      this.siteWideLinks.set(url, extractedTags.aTags);
      if (extractedTags.title[0] && extractedTags.title[0].innerText) {
        this.logTitleTag(url, extractedTags.title[0].innerText, pageResults);
      }

      const metaDescription = extractedTags.meta.find((m) => m.name && m.name.toLowerCase() === 'description');
      if (metaDescription) {
        this.logMetaDescription(url, metaDescription.content, pageResults);
      }

      for (let rule of this.rulesToUse) {
        let currentRule: IRule = Object.assign({}, rule);
        currentRule.errors = [];
        currentRule.info = [];
        currentRule.warnings = [];
        await currentRule.validator(
          { result: extractedTags, response: { url, host: this.host }, preferences: {} },
          {
            test: (params: ITesterParameters) => {
              try {
                params.assert(params.value1, params.value2);
              }
              catch (ex) {
                currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content });
              }
            },
            trueOrFalse: (params: ITesterParametersBool) => {
              try {
                params.assert(params.value);
              }
              catch (ex) {
                currentRule.errors.push({ message: params.message, priority: params.priority, content: params.content });
              }
            },
            lint: (params: ITesterParametersBool) => {
              try {
                params.assert(params.value);
              }
              catch (ex) {
                currentRule.warnings.push({ message: params.message, priority: params.priority, content: params.content });
              }
            }
          },
        );
        this.finishRule(currentRule)
        results.push(currentRule);
      }

      const display = ['warnings', 'errors'];
      const out = display
        .reduce((out, key) => {
          return [
            ...out,
            ...results
              .filter((r) => !r.success)
              .reduce((o, ruleResult) => {
                return [
                  ...o,
                  ...ruleResult[key]
                    .sort((a: IMessage, b: IMessage) => a.priority - b.priority)
                    .map((r) => ({ ...r, level: key })),
                ];
              }, [] as IMessage[]),
          ];
        }, [] as IMessage[]);

      pageResults.results = out;
      return pageResults;
    } catch (e) {
      console.error(e);
    }
  };

  private async analyseFromSimpleHTMLCall(url: string): Promise<IAnalyserPageResults> {
    let analyserResult: any;
    try {
      const response = await axios({
        method: 'get',
        url: url,
      });
      analyserResult = await this.test(response.data, url);
    } catch (ex) {
      analyserResult.brokenInternalLinks = [url];
    }
    return analyserResult;
  }

  private async getHtmlFromSPA(url: string): Promise<IAnalyserPageResults> {
    const data = await render(url, {});
    const result = await this.test(data, url);
    return result;
  }

  private getAnchors(html: string): { aTags: any[] } {
    const $ = cheerio.load(html);
    return {
      aTags: this.getAttributes($, 'a'),
    }
  }

  private getLinksFromPage(fetchedData: IFetchedPageResults): string[] {
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
      //const externalLinks:string[] = links.filter(item => item.includes('http'));
      return internalLinks;
    }
  }

  private async getSitemap(fetchedData: IFetchedPageResults): Promise<any[]> {
    let links: IFetchedPageResults[] = [fetchedData];
    const childLinksToCrawl = this.getLinksFromPage(fetchedData);
    for (const link of childLinksToCrawl) {
      const childrenFetchedData = await this.getHtmlFromUri(link);
      links.push(childrenFetchedData);
    }
    return _.uniqBy(links, "url");
  }

  private async getHtmlFromUri(url: string): Promise<IFetchedPageResults> {
    const browser = await puppeteer.launch();
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
    let globalResults: IPageResults = {
      results: [],
      sitemap: []
    };
    // Get Homepage html (only for regular website)
    const fetchedResult = await this.getHtmlFromUri(url);
    //Compute Sitemap
    globalResults.sitemap = await this.getSitemap(fetchedResult);

    //Compute Rules
    for (const fetchedData of globalResults.sitemap) {
      let results = await this.analyseFromSimpleHTMLCall(fetchedData.url);
      if (results)
        globalResults.results.push(results);
    }

    // Clear html
    for (const sitemap of globalResults.sitemap) {
      sitemap.html = "";
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
