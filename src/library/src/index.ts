import { SeoAnalyzer } from "./seo/analyzer";
import { IPageResults } from "./seo/models/interfaces";
import { rules } from "./seo/rules/rules";
import puppeteer, {JSHandle} from 'puppeteer'
import { error } from "console";

/**
 * Check url validity
 * @param url string to validate
 * @returns boolean value, TRUE = is valid, FALSE = is not valid
 */
const isValidUrl = (url: string) => {
    return url.startsWith("http")
}

const mockAnalizerResolve = async (duration: number): Promise<any> => {
    return new Promise((resolve, reject) => setTimeout(() => {
        // console.log('Resolving something')
        resolve(true)},
        duration,
        'param1'));
}

const mockAnalizerReject = async (duration: number): Promise<any> => {
    return new Promise((resolve, reject) => setTimeout(() => {
        // console.log('Rejecting something')
        reject(false)},
        duration,
        'param1'));
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
    const browser = await puppeteer.launch();
    const puppeteerPage = await browser.newPage();

    //Iterate over all given urls
    for(const url of urls){
      //start with url provided
      toExploreURL.add(url)
      if(exploredURL.has(url)){
        continue;
      }

      //TODO: determine baseURL
      const baseURL = 'https://kasty.io/'
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
          if(!exploredURL.has(link)//add only unexplored links
          && !toExploreURL.has(link)//avoid setting a value already existing
          && link.startsWith(baseURL)){//add only link on the same base URL, we dont want to crawl the whole (S)WEB
            toExploreURL.add(link);
          }
        }

        //Sync both list for next iteration
        exploredURL.add(currentUrl);
        toExploreURL.delete(currentUrl);

        console.log("Explored URLs", exploredURL)
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
const terminator = async (siteUrls: string[], features: string[]): Promise<string[]> => {
    console.log('Terminator is walking in the streets')
    console.log('Provided URLs => ', siteUrls)
    console.log("Active features ", features)

    //Init
    const urls = new Set(siteUrls)//Deduplicate urls
    const results = undefined;

    //Guard clauses for
    if(urls.size > 0 && [...urls].every(isValidUrl)) {
        //Pre-processors

        for await (let pptrPage of explorer([...urls])) {
          //Page is a DOMElement or equivalent exposed by puppeteer
          const pageName = await pptrPage?.title();
          console.log("Explorer return a pptrPage name => ", pageName);
          
          //Set selected feature Promise array
          //TODO: invoke each selected feature from the lib
          console.log('Launch Analysis =====>')
          const selectedFeatures = []
          //Setting Analyzer to run
          selectedFeatures.push(mockAnalizerResolve(800))
          selectedFeatures.push(mockAnalizerResolve(1800))
          selectedFeatures.push(mockAnalizerReject(200))
          selectedFeatures.push(mockAnalizerResolve(1200))
          selectedFeatures.push(mockAnalizerResolve(300))
          selectedFeatures.push(mockAnalizerReject(2000))
          const analysis = await Promise.allSettled(selectedFeatures)
        //   console.log("analysis results => ", analysis.map(x => x.status))
          //Store analysis result for this page
        }

        //Post process; Consolidate analysis ?

        //Build relations between result analysis and CMS content,
        //categorized by profile (Contributor / Developer)

        return Promise.resolve(results);
    }
    else {
        const err = new Error("URLs provided are not valid")
        return Promise.reject(err);
    }
  }

export { terminator }