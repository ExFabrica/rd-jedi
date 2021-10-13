export interface IMessage {
    message: string;
    priority: number;
    content: any;
};

export interface IRule {
    name: string;
    description: string;
    success?: boolean,
    errors?: IMessage[],
    warnings?: IMessage[],
    info?: IMessage[],
    validator?: (payload: any, param2: ITester) => void;
    testData?: any
};

export interface IAnalyserPageResults {
    uid: string,
    url: string;
    results: IMessage[];
    duplicateTitles?: any[],
    duplicateMetaDescriptions?: any[],
    orphanPages?: any[],
    brokenInternalLinks?: any[],
    tags: any[]
};

export interface IFetchedPageResults {
    url: string,
    html: string;
    screenshot: string;
};

export interface IPageResults {
    results: IAnalyserPageResults[];
    sitemap: IFetchedPageResults[];
};

export interface ITester {
    test: (params: ITesterParameters) => void;
    trueOrFalse: (params: ITesterParametersBool) => void
    lint: (params: ITesterParametersBool) => void;
}

export interface ITesterParameters {
    priority: number,
    assert: any,
    value1: any,
    value2: any,
    message: string,
    content?: string
}

export interface ITesterParametersBool {
    priority: number,
    assert: any,
    value: any,
    message: string,
    content?: string
}