import { IPageResults } from "./analyser/seo/interface";
import { rules } from "./analyser/seo/rules";
import { SeoTester } from "./analyser/seo/tester";

module.exports = async function analyze(uri: string): Promise<any> {
    uri = !uri ? "https://demo-front.kasty.io/fr" : uri;
    const tester = new SeoTester(rules, uri);
    const globalResults: IPageResults = await tester.run(uri);
    return globalResults;
};