export enum IPersonTarget {
    contentManager = 0,
    developer = 1,
    both = 2,
};

export interface IRuleResultMessage {
    message: string;
    priority: number;
    content: any;
    target: IPersonTarget;
};

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

export interface IRule {
    name: string;
    description: string;
    success?: boolean,
    errors?: IRuleResultMessage[],
    warnings?: IRuleResultMessage[],
    info?: IRuleResultMessage[],
    validator?: (payload: any, param2: ITester) => void;
    testData?: any
};

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

export interface ISitemapPageDetails {
    url: string,
    html: string;
    screenshot: string;
};

export interface IPageResults {
    results: IAnalysisPageResults[];
    sitemap: ISitemapPageDetails[];
};

export interface ITester {
    test: (params: IRuleParametersComparaisonTest) => void;
    trueOrFalse: (params: IRuleParametersForBooleanTest) => void
    lint: (params: IRuleParametersForBooleanTest) => void;
}

export interface IRuleParametersComparaisonTest {
    priority: number,
    assert: any,
    value1: any,
    value2: any,
    message: string,
    content?: string,
    target: IPersonTarget
}

export interface IRuleParametersForBooleanTest {
    priority: number,
    assert: any,
    value: any,
    message: string,
    content?: string,
    target: IPersonTarget
}