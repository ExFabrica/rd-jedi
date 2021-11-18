import { IRuleResultMessage } from "../../common/models/rule.interfaces";

export interface ITags {
    html: any[];
    title: any[];
    meta: any[];
    ldjson: any[];
    h1s: any[];
    h2s: any[];
    h3s: any[];
    h4s: any[];
    h5s: any[];
    h6s: any[];
    canonical: any[];
    imgs: any[];
    aTags: any[];
    linkTags: any[];
    ps: any[];
    body: any[];
}

export interface IAnalysisPageResults {
    uid: string,
    url: string;
    results: IRuleResultMessage[];
    duplicateTitles?: any[],
    duplicateMetaDescriptions?: any[],
    orphanPages?: any[],
    brokenInternalLinks?: any[],
    tags: ITags
};

export interface ISitemapPageResults {
    url: string,
    html: string;
    screenshot: string;
};

export interface IPageResults {
    results: IAnalysisPageResults[];
    sitemap: ISitemapPageResults[];
};