import { IUserTarget } from "./target.interface";

export interface ITester {
    compareTest: (params: ITesterCompareParams) => void;
    BooleanTest: (params: ITesterBooleanParams) => void
    BooleanLint: (params: ITesterBooleanParams) => void;
}

export interface ITesterCompareParams {
    priority: number,
    assert: any,
    value1: any,
    value2: any,
    message: string,
    content?: string,
    target: IUserTarget,
    tag: string,
}

export interface ITesterBooleanParams {
    priority: number,
    assert: any,
    value: any,
    message: string,
    content?: string,
    target: IUserTarget,
    tag: string
}