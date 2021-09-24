import axios from 'axios';
import cheerio from 'cheerio';
import { render } from 'usus';
import { IMessage, IRule, ISiteResults } from './interface';

export const defaultPreferences = {
  internalLinksLowerCase: true,
  internalLinksTrailingSlash: true,
};

type TPair = [string, string];

type TLinkers = {
  [key: string]: string[];
};

export class SeoTester {
  private currentUrl: string;
  private currentRule: IRule;
  private results: IRule[];
  private rulesToUse: any;
  private internalLinks: TPair[];
  private pagesSeen: Set<string>;
  private siteWideLinks: Map<any, any>;
  private titleTags: Map<any, any>;
  private metaDescriptions: Map<any, any>;

  public constructor(private rules: any,
    private host: string) {
    this.currentRule = this.getEmptyRule();
    this.results = [];
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

  private logMetaDescription(meta, siteResults) {
    if (this.metaDescriptions.has(meta)) {
      siteResults.duplicateMetaDescriptions.push([this.metaDescriptions.get(meta), this.currentUrl]);
    } else {
      this.metaDescriptions.set(meta, this.currentUrl);
    }
  }

  private logTitleTag(title, siteResults) {
    if (this.titleTags.has(title)) {
      siteResults.duplicateTitles.push([this.titleTags.get(title), this.currentUrl]);
    } else {
      this.titleTags.set(title, this.currentUrl);
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

  private finishRule() {
    if (this.currentRule.errors.length === 0 && this.currentRule.warnings.length === 0) this.currentRule.success = true;
    this.results.push(this.currentRule);
    this.currentRule = this.getEmptyRule();
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
      this.currentUrl = url;
      this.pagesSeen.add(url);

      let siteResults: ISiteResults = {
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
        this.logTitleTag(result.title[0].innerText, siteResults);
      }

      const metaDescription = result.meta.find((m) => m.name && m.name.toLowerCase() === 'description');
      if (metaDescription) {
        this.logMetaDescription(metaDescription.content, siteResults);
      }

      result.aTags
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
        this.finishRule();
      }

      const display = ['warnings', 'errors'];
      const out = display
        .reduce((out, key) => {
          return [
            ...out,
            ...this.results
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

      siteResults[url] = out;
      return siteResults;

    } catch (e) {
      console.error(e);
    }
  };

  private renderResult(siteResults: ISiteResults): any {
    // Format links.
    const whatLinksWhere: TLinkers = {};
    for (const [linker, links] of this.siteWideLinks.entries()) {
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        // TODO create a list with all specific cases.
        if (link.href && !link.href.includes("http") && !link.href.includes("#") && link.href !== '/') {
          if (!whatLinksWhere[link.href])
            whatLinksWhere[link.href] = [];
          whatLinksWhere[link.href].push(linker);
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
      { meta: { whatLinksWhere } },
    );
    return outResults;
  }

  private async getHtml(url: string): Promise<any> {
    const response = await axios({
      method: 'get',
      url: url,
    });
    const result = await this.test(response.data, url);
    if (!result)
      return null;
    return this.renderResult(result);
  }

  private async getHtmlFromSPA(url: string): Promise<any> {
    const data = await render(url, {});
    const result = await this.test(data, url);
    return this.renderResult(result);
  }

  public async run(url: string): Promise<any> {
    // First test with a simple get
    let result = await this.getHtml(url);
    if (!result)
      // no result from base analysis -> swithc to SPA analyser
      result = await this.getHtmlFromSPA(url);
    return result;
  }
};
