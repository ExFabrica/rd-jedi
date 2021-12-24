import { IRuleResultMessage } from "../../common/models/rule.interfaces";

export interface IPageResult {
    type?: string,
    result: IAnalysisPageResults;
};

export interface IAnalysisPageResults {
    uid: string,
    url: string;
    results?: IRuleResultMessage[];
    images?: IImagesRetrived[];
};

export interface IImagesRetriver {
    images: IImagesRetrived[]
}

export interface IImagesRetrived {
    src: string,
    srcset?: string,
    sizes?: string,
    height: number,
    width: number,
    alt: string,
};
