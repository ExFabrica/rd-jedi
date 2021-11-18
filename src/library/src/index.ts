import { SeoAnalyzer } from "./seo/analyzer";
import { IPageResults } from "./seo/models/interfaces";
import { rules } from "./seo/rules/rules";

module.exports = async function analyze(uri: string): Promise<any> {
    uri = !uri ? "https://demo-front.kasty.io/fr" : uri;
    const tester = new SeoAnalyzer(rules, uri);
    const globalResults: IPageResults = await tester.run(uri).catch(
        (err) => {
            return Promise.reject(err);
        });
    return globalResults;
};