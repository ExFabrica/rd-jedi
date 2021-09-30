export interface IMessage {
    message: string;
    priority: number;
};

export interface IRule {
    name: string;
    description: string;
    success: boolean,
    errors: IMessage[],
    warnings: IMessage[],
    info: IMessage[],
};

export interface ISiteResults {
    url: string;
    results: IMessage[];
    duplicateTitles?: any[],
    duplicateMetaDescriptions?: any[],
    orphanPages?: any[],
    brokenInternalLinks?: any[],
};
