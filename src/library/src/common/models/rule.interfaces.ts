import { IUserTarget } from "./target.interface";
import { ITester } from "./tester.interfaces";

export interface IRuleResultMessage {
    message: string;
    priority: number;
    content: any;
    target: IUserTarget;
    tag: string;
    global: boolean;
    data?: any;
};

export interface IRule {
    name: string;
    description: string;
    validator?: (payload: any, param2: ITester) => Promise<void>;
    success?: boolean;
    errors?: IRuleResultMessage[];
    warnings?: IRuleResultMessage[];
    info?: IRuleResultMessage[];
    data? : any;
    testData?: any;
};