import { rules } from "./analyser/seo/rules";
import { seoTester } from "./analyser/seo/tester";

const tester = seoTester({rules, siteWide:true});
const { ...results } = tester.analyse("public");
console.log("tester", results);