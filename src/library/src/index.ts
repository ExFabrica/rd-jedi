import { SeoAnalyzer } from "./seo/analyzer";
import { IPageResult as SEOPageResult } from "./seo/models/interfaces";
import {rules as SEORules} from "./seo/rules/rules"
import puppeteer from 'puppeteer'

type SeoPreview = Omit<SEOPageResult, "type">
interface ComputedResults {
  Sitemap: string[];
  SEO?: SeoPreview[];
}

/**
 * Use URL API to retrive base url from given URL
 * @param url URL to check
 * @returns base url as string
 */
const retriveBaseUrl = (url: string): string => {
  let baseUrl;
  try {
    const { protocol, host } = new URL(url);
    baseUrl = `${protocol}//${host}/`;
  } catch (error) {
    console.error("Fail to compute baseURL ", error);
  }
  return baseUrl;
}

/**
 * Check url validity
 * @param url string to validate
 * @returns boolean value, TRUE = is valid, FALSE = is not valid
 */
const isValidUrl = (url: string) => {
  let isValid = false;
  try {
    const _url = new URL(url)
    isValid = true
  } catch (error) {
    console.log("Fail to pass URL validation => ", error)
  }
  return isValid
}

const categorizedResult = (results: ComputedResults, pptrPage: puppeteer.Page, analysis: PromiseSettledResult<SEOPageResult>[], features: string[]) => {
  results.Sitemap.push(pptrPage.url());
  for (const analyseResult of analysis) {
    if (features.includes('SEO')) {
      if (analyseResult.status == "fulfilled" && analyseResult?.value?.type == "SEO") {
        //Remove analysis type to avoid redoundancy information 
        const {result, pageInfo} = analyseResult?.value
        results.SEO.push({result, pageInfo});
      } else if (analyseResult.status == "rejected") {
        console.error("SEO Analysis failed : ", analyseResult?.reason);
      }
    }
  }
}

/**
   * Explore a list of URL, navigate throught the links found on the pages
   * Each time it navigate to a new page, it yield the DOM for analysis
   * @param browser puppeteer instance
   * @param urls Website URLs to crawl
   */
 const explorer = async function*(urls: string[]) {
    //Init explorer lists
    const exploredURL = new Set<string>();
    const toExploreURL = new Set<string>();
    //Init puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      args: ['--no-sandbox']
    });
    const puppeteerPage = await browser.newPage();

    //Iterate over all given urls
    for(const url of urls){
      //Start with url provided;
      //Retrieve the base url from the given string
      let baseURL;
      baseURL = retriveBaseUrl(url);
      if(exploredURL.has(baseURL)){
        continue;
      }
      toExploreURL.add(baseURL)

      while (toExploreURL.size > 0) {
        const toExploreIterator = toExploreURL[Symbol.iterator]()
        
        //Get the first item from the Set 'toExploreURL'
        const currentUrl = toExploreIterator.next().value

        //Puppeteer navigate to the given URL
        await puppeteerPage.goto(currentUrl);
        console.log("Exploring ", currentUrl);

        //Retrive all links from the current page
        const linksFound = (await puppeteerPage.$$('a'))
        
        //Add each link to toExplore Set, unicity is maintained by Set object
        for(const pptrElement of linksFound) {
            const link = await pptrElement.getProperty('href').then(r => r._remoteObject.value)
          if(link != currentUrl
            && !exploredURL.has(link)//add only unexplored links
            && !toExploreURL.has(link)//avoid setting a value already existing
            && link.startsWith(baseURL)){//add only link on the same base URL, we dont want to crawl the whole (S)WEB
            toExploreURL.add(link);
          }
        }

        //Sync both list for next iteration
        exploredURL.add(currentUrl);
        toExploreURL.delete(currentUrl);

        console.log("Already explored URLs", exploredURL)
        console.log('URLs to explore', toExploreURL)

        yield puppeteerPage; //Expose each navigable page only once for different analysis
      }
    }
    return null;
  }

 /**
   * Schedule analysis while exploring pages of given urls
   * @param siteUrls List of website URL to run the tool on; ex: ['https://www.exfabrica.io/', https://kasty.io/]
   * @param features List of analyse to run on selected website; ex: ['SEO', 'Image']
   * @returns Analysis made by selected features on each website
   */
const terminator = async (siteUrls: string[], features: string[]): Promise<ComputedResults> => {
    console.log('Terminator: Sarah Connor ?')
    console.log('Provided URLs => ', siteUrls)
    console.log("Active features ", features)

    //Init
    const urls = new Set(siteUrls)//Deduplicate urls
    const results = {Sitemap: [], SEO: []} as ComputedResults;

    //Guard clauses for
    if(urls.size > 0 && [...urls].every(isValidUrl)) {
        //Pre-processors

        for await (let pptrPage of explorer([...urls])) {
          //Page is a DOMElement or equivalent exposed by puppeteer
          const pageName = await pptrPage?.title();
          console.log("Explorer return a pptrPage name => ", pageName);
          console.log('Launch Analysis =====>')
          
          const selectedFeatures = []
          //Setting Analyzers to run
          if(features.includes('SEO')){
            const seoAnalyzer = new SeoAnalyzer(SEORules, "")
            selectedFeatures.push(seoAnalyzer.run(pptrPage))
          }

          const analysis = await Promise.allSettled(selectedFeatures)
          console.log("analysis results => ", analysis.map(x => x.status))
         
          //Store analysis result for this page by feature
          categorizedResult(results, pptrPage, analysis, features);
        }

        //Post process; Consolidate analysis ?

        console.log('Terminator : I’ll be back.')
        return Promise.resolve(results);
    }
    else {
        const err = new Error("URLs provided are not valid")
        return Promise.reject(err);
    }
  }

export { terminator }
