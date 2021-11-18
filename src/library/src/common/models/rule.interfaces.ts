import { IUserTarget } from "./target.interface";
import { ITester } from "./tester.interfaces";

export interface IRuleResultMessage {
    message: string;
    priority: number;
    content: any;
    target: IUserTarget;
};

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