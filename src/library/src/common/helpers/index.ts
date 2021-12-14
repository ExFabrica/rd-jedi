import { IUserTarget } from "../models/target.interface";
import { ITesterCompareParams, ITesterBooleanParams } from "../models/tester.interfaces";

export class Helper {
    static getComparaisonTestParameters = (
        priority: number,
        assert: any,
        value1: any,
        value2: any,
        message: string,
        target: IUserTarget,
        tag: string,
        content?: string,
    ): ITesterCompareParams => {
        return {
            priority: priority,
            assert: assert,
            value1: value1,
            value2: value2,
            message: message,
            target: target,
            content: content,
            tag: tag
        };
    }

    static getBooleanTestParameters = (
        priority: number,
        assert: any,
        value: any,
        message: string,
        target: IUserTarget,
        tag: string,
        content?: string,
    ): ITesterBooleanParams => {
        return {
            priority: priority,
            assert: assert,
            value: value,
            message: message,
            target: target,
            content: content,
            tag: tag
        };
    }

    static cleanString = (str) =>
        str
            .toLowerCase()
            .replace('|', '')
            .replace('-', '')
            .replace('.', '')
            .replace(':', '')
            .replace('!', '')
            .replace('?', '');

}
