import axios from 'axios';
import cheerio from 'cheerio';
import { render } from 'usus';
import { IMessage, IRule, ISiteResults } from './interface';
var _ = require('lodash');
var Crawler = require("simplecrawler");

export const defaultPreferences = {
  internalLinksLowerCase: true,
  internalLinksTrailingSlash: true,
};

type TPair = [string, string];

export class SeoTester {
  private currentRule: IRule;
  private rulesToUse: any;
  private internalLinks: TPair[];
  private pagesSeen: Set<string>;
  private siteWideLinks: Map<any, any>;
  private titleTags: Map<any, any>;
  private metaDescriptions: Map<any, any>;
  private crawledUrls: string[] = [];

  public constructor(private rules: any,
    private host: string) {
    this.currentRule = this.getEmptyRule();
    this.rulesToUse = this.rules.length > 0 ? this.rules : []
    this.internalLinks = [];
    this.siteWideLinks = new Map();
    this.titleTags = new Map();
    this.metaDescriptions = new Map();
    this.pagesSeen = new Set();
  }

  private getEmptyRule(): IRule {
    return {
      name: '',
      description: '',
      success: false,
      errors: [],
      warnings: [],
      info: []
    };
  }

  private logMetaDescription(url: string, meta: string, siteResults: ISiteResults) {
    if (this.metaDescriptions.has(meta)) {
      siteResults.duplicateMetaDescriptions.push([this.metaDescriptions.get(meta), url]);
    } else {
      this.metaDescriptions.set(meta, url);
    }
  }

  private logTitleTag(url: string, title: string, siteResults: ISiteResults) {
    if (this.titleTags.has(title)) {
      siteResults.duplicateTitles.push([this.titleTags.get(title), url]);
    } else {
      this.titleTags.set(title, url);
    }
  }

  private noEmptyRule() {
    if (!this.currentRule.name || this.currentRule.name.length === 0) throw Error('No current test name');
    if (!this.currentRule.description || this.currentRule.description.length === 0)
      throw Error('No current test description');
  }

  private runATest(defaultPriority = 50, arrName) {
    return (t, ...params) => {
      let test = t;
      let priority = defaultPriority;

      // allows overwriting of priority
      if (typeof test !== 'function') {
        priority = t;
        test = params.splice(0, 1)[0];
      }

      this.noEmptyRule();
      try {
        return test(...params);
      } catch (e) {
        this.currentRule[arrName].push({ message: e.message, priority });
        return e;
      }
    };
  }

  private startRule({ validator, test, testData, ...payload }) {
    if (this.currentRule.errors.length > 0)
      throw Error(
        "Starting a new rule when there are errors that haven't been added to results. Did you run 'finishRule'? ",
      );
    if (this.currentRule.warnings.length > 0)
      throw Error(
        "Starting a new rule when there are warnings that haven't been added to results. Did you run 'finishRule'? ",
      );
    this.currentRule = Object.assign(this.currentRule, payload);
  }

  private finishRule(): IRule {
    if (this.currentRule.errors.length === 0 && this.currentRule.warnings.length === 0) this.currentRule.success = true;
    this.currentRule = this.getEmptyRule();
    return { ...this.currentRule }
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

  private async test(html: string, url: string): Promise<ISiteResults> {
    try {
      this.pagesSeen.add(url);
      let results: IRule[] = [];

      let siteResults: ISiteResults = {
        url: url,
        results: [],
        duplicateTitles: [],
        duplicateMetaDescriptions: [],
        orphanPages: [],
        brokenInternalLinks: [],
      }

      const result = this.getTags(html);
      // SPA detection
      // TODO make a better detection
      if (result.h1s.length === 0 && result.h2s.length === 0 && result.h3s.length === 0 && result.imgs.length === 0)
        return null;

      this.siteWideLinks.set(url, result.aTags);
      if (result.title[0] && result.title[0].innerText) {
        this.logTitleTag(url, result.title[0].innerText, siteResults);
      }

      const metaDescription = result.meta.find((m) => m.name && m.name.toLowerCase() === 'description');
      if (metaDescription) {
        this.logMetaDescription(url, metaDescription.content, siteResults);
      }

      /*result.aTags
        .filter((a) => !!a.href)
        .filter((a) => !a.href.includes('http'))
        .filter((a) => {
          if (this.currentUrl !== '/') {
            return !a.href.endsWith(this.currentUrl);
          }
          return true;
        })
        .filter((a) => a.href !== this.currentUrl)
        .map((a) => a.href)
        .forEach((a) => this.internalLinks.push([a, this.currentUrl]));
        */

      for (let i = 0; i < this.rulesToUse.length; i++) {
        const rule = this.rulesToUse[i];
        this.startRule(rule);
        await rule.validator(
          { result, response: { url, host: this.host }, preferences: {} },
          {
            test: this.runATest(70, 'errors'),
            lint: this.runATest(40, 'warnings'),
          },
        );
        results.push(this.finishRule());
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

      siteResults.results = out;
      return siteResults;
    } catch (e) {
      console.error(e);
    }
  };

  private renderResult(siteResults: ISiteResults): any {
    // Format links.
    const whatLinksWhere: string[] = [];
    for (const [linker, links] of this.siteWideLinks.entries()) {
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        // TODO create a list with all specific cases.
        if (link.href && !link.href.includes("http") && !link.href.includes("#") && link.href !== '/') {
          if (!whatLinksWhere.includes(link.href))
            whatLinksWhere.push(link.href);
        }
      }
    }
    // format rules
    const outResults = Object.keys(siteResults).reduce(
      (out, key) => {
        if (Array.isArray(siteResults[key]) && siteResults[key].length > 0) {
          out[key] = siteResults[key];
        }
        return out;
      },
      { url : siteResults.url }
      //{ links: whatLinksWhere },
    );
    return outResults;
  }

  private async getHtml(url: string): Promise<any> {
    let result: ISiteResults = {
      brokenInternalLinks: [],
      results: [],
      url: url
    };
    try {
      const response = await axios({
        method: 'get',
        url: url,
      });
      result = await this.test(response.data, url);
      if (!result)
        return null;
    } catch (ex) {
      result.brokenInternalLinks = [url];
    }
    return this.renderResult(result);
  }

  private async getHtmlFromSPA(url: string): Promise<any> {
    const data = await render(url, {});
    const result = await this.test(data, url);
    return this.renderResult(result);
  }


  private getAnchors(html: string): any {
    const $ = cheerio.load(html);
    return {
      aTags: this.getAttributes($, 'a'),
    }
  }

  private getLinksFromPage(html: string, relativeUrl: string, baseUrl: string) {
    const result = this.getAnchors(html);
    if (result.aTags && result.aTags.length > 0) {
      const links = _.uniq(result.aTags.filter(link => link.href != null).map(link => link.href));
      const internalLinks = links.filter(link =>
        !link.includes('#') &&
        !link.includes('http') &&
        !link.includes(baseUrl) &&
        !link.includes('mailto:') &&
        !link.includes('tel:') &&
        link !== '/').map(item => {
          if (_.startsWith(item, '/'))
            return `${baseUrl}${item}`;
          else
            return `${baseUrl}/${item}`
        });
      const externalLinks = links.filter(item => item.includes('http'));
      return internalLinks;
    }
  }

  private async getSitemap(html: string, baseUrl: string): Promise<any[]> {
    let links: any[] = [baseUrl];
    const childLinksToCrawl = this.getLinksFromPage(html, "", baseUrl);
    links = _.concat(links, childLinksToCrawl);
    // For now just the first childs are crawled
    // TODO -> Make this in recusive mode and add a parameter to fix the deep od the crawling process.
    // TODO -> Add some webworkers to run in parallel mode.
    for (const link of childLinksToCrawl) {
      const html = await this.getHtmlFromUri(link);
      const childLinks = await this.getLinksFromPage(html, link, baseUrl);
      if (childLinks)
        links = _.concat(links, childLinks);
    }
    return _.uniq(links);
  }

  private async getHtmlFromUri(url: string): Promise<string> {
    let html: string = "";
    try {
      const response = await axios({
        method: 'get',
        url: url,
      });
      html = response.data;
    }
    catch (ex) {
      html = "error"
    }
    return html;
  }

  public async run(url: string): Promise<any> {
    const globalResult = [];
    // Get Homepage html (only for regular website)
    const html = await this.getHtmlFromUri(url);
    //Compute Sitemamp
    const links = await this.getSitemap(html, url);
    console.log("siteMap", links);

    for (const link of links) {
      let results = await this.getHtml(link);
      if(results)
        globalResult.push(results);
    }

    return globalResult; 

    //console.log("globalResult", globalResult);

    /*const mainUrl = url;
    const mainResults = [];
    // First test with a simple get
    let results = await this.getHtml(url);
    if (!results) {
      // no result from base analysis -> swithc to SPA analyser
      results = await this.getHtmlFromSPA(url);
    }

    mainResults.push({ url: url, analyse: results[url] });

    if (results.links && results.links.length > 0) {
      for (const link of results.links) {
        const computedLink = link.indexOf('/') === -1 ? "/" + link : link;
        const realLink = url + computedLink;
        console.log("realLink", realLink);
        let resultsChild = [];
        try {
          resultsChild = await this.getHtml(realLink);
          console.log("resultsChild", resultsChild);
        }
        catch (ex) {
          mainResults.push({ url: realLink, analyse: "error" });
        }
        if (!results)
          mainResults.push({ url: realLink, analyse: "error" });
        else
          mainResults.push({ url: realLink, analyse: resultsChild[realLink] });
      }
    }
    return mainResults;*/
  }
};
