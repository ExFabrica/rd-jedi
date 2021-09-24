import { rules } from "./analyser/seo/rules";
import { SeoTester } from "./analyser/seo/tester";

const tester = new SeoTester(rules, "https://demo-front.kasty.io/fr");
tester.run("https://demo-front.kasty.io/fr").then(results => {
    console.log("Analyse result", results);
})//https://demo-front.kasty.io/fr
