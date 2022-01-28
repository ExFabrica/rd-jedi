//Analyzers
import { SeoAnalyzer } from "./seo/analyzer";
import { ImagesAnalyzer } from "./images/analyzer";
//Analyzer results interfaces
import { IPageResult as SEOPageResult } from "./seo/models/interfaces";
import { IPageResult as ImagesPageResult } from "./images/models/interfaces";
//Analyzer rules
import { rules as SEORules } from "./seo/rules/rules";
import { rules as ImagesRules } from "./images/rules/rules";
import { RTRules } from "./seo/rules/real-time.rules";
import { IRuleResultMessage } from "./common/models/rule.interfaces";
//Tooling
import puppeteer from "puppeteer";
const Crawler = require('node-html-crawler');

type SeoPreview = Omit<SEOPageResult, "type">;
type ImagesPreview = Omit<ImagesPageResult, "type">;
interface ComputedResults {
  Sitemap: string[];
  SEO?: SeoPreview[];
  Images?: ImagesPreview[];
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
    const _url = new URL(url);
    isValid = !url.includes("#");
  } catch (error) {
    console.log("Fail to pass URL validation => ", error);
  }
  return isValid;
}

const categorizedResult = (results: ComputedResults, pptrPage: puppeteer.Page, analysis: PromiseSettledResult<SEOPageResult | ImagesPageResult>[], features: string[]) => {
  results.Sitemap.push(pptrPage.url());
  for (const analyseResult of analysis) {
    if (features.includes('SEO')) {
      if (analyseResult.status == "fulfilled" && analyseResult?.value?.type == "SEO") {
        //Remove analysis type to avoid redoundancy information 
        const { result, pageInfo } = (analyseResult?.value as unknown as SeoPreview);
        //Set page depth
        const filteredDepths = depth.filter(item => item.url == pageInfo.url);
        if (filteredDepths && filteredDepths.length > 0)
          pageInfo.depth = depth.filter(item => item.url == pageInfo.url)[0].depth;
        results.SEO.push({ result, pageInfo });
      } else if (analyseResult.status == "rejected") {
        console.error("SEO Analysis failed : ", analyseResult?.reason);
      }
    }
    if (features.includes('Images')) {
      if (analyseResult.status == "fulfilled" && analyseResult?.value?.type == "Images") {
        //Remove analysis type to avoid redoundancy information 
        const { result } = (analyseResult?.value as unknown as ImagesPreview);
        results.Images.push({ result });
      } else if (analyseResult.status == "rejected") {
        console.error("Images Analysis failed : ", analyseResult?.reason);
      }
    }
  }
}
let depth: any[] = [];
/**
   * Explore a list of URL, navigate throught the links found on the pages
   * Each time it navigate to a new page, it yield the DOM for analysis
   * @param browser puppeteer instance
   * @param urls Website URLs to crawl
   */
const explorer = async function* (urls: string[]) {
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
  for (const url of urls) {
    //Start with url provided;
    //Retrieve the base url from the given string
    let baseURL;
    baseURL = retriveBaseUrl(url);
    if (exploredURL.has(baseURL))
      continue;

    toExploreURL.add(baseURL);
    depth.push({ url: baseURL, parentUrl: "", depth: 1 });

    let navigatedElements: NavigatedElement[] = []

    while (toExploreURL.size > 0) {

      const toExploreIterator = toExploreURL[Symbol.iterator]();
      //Get the first item from the Set 'toExploreURL'
      const currentUrl = toExploreIterator.next().value;
      //Puppeteer navigate to the given URL
      await puppeteerPage.goto(currentUrl);
      console.log("Exploring ", currentUrl);

      //Retrive all links from the current page
      const linksFound = (await puppeteerPage.$$('a'));
      
      const linkNavigationElements: string[] = await Promise.all(
        linksFound.map(async pptrElement => await pptrElement.getProperty('href').then(r => r._remoteObject.value))
      )
      const hiddenNavigationElements = (await listHiddenNavigationElements(puppeteerPage, navigatedElements)).map(x => x.url);
      console.log("Found " + hiddenNavigationElements.length + " onclick navigation elements");

      const navigationElements = [...linkNavigationElements, ...hiddenNavigationElements]

      //Add each link to toExplore Set, unicity is maintained by Set object
      for (const link of navigationElements) {
        if (!link.includes("?")) {
          if (link != currentUrl
            && !exploredURL.has(link)//add only unexplored links
            && !toExploreURL.has(link)//avoid setting a value already existing
            && link.startsWith(baseURL)
            && !link.includes("#")) {//add only link on the same base URL, we dont want to crawl the whole (S)WEB
            toExploreURL.add(link);
          }
        } else {
          //Get the url without queryString
          const linkWithoutQueryString = link.split("?")[0];
          const filteredExploredURL = Array.from(exploredURL).map(item => item.includes("?") ? item.split("?")[0] : item);
          const filteredToExploreURL = Array.from(toExploreURL).map(item => item.includes("?") ? item.split("?")[0] : item);
          if (!filteredExploredURL.includes(linkWithoutQueryString)
            && !filteredToExploreURL.includes(linkWithoutQueryString)
            && link != currentUrl
            && !exploredURL.has(link)//add only unexplored links
            && !toExploreURL.has(link)//avoid setting a value already existing
            && link.startsWith(baseURL)
            && !link.includes("#")) {//add only link on the same base URL, we dont want to crawl the whole (S)WEB
            toExploreURL.add(link);
          }
          //calculate the depth
          const parents = depth.filter(item => item.url === currentUrl);
          if (parents && parents.length > 0) {
            const parent = parents[0];
            depth.push({ url: link, parentUrl: currentUrl, depth: parent.depth + 1 });
          }
        }
      }

      //Sync both list for next iteration
      exploredURL.add(currentUrl);
      toExploreURL.delete(currentUrl);

      console.log("Already explored URLs", exploredURL);
      console.log('URLs to explore', toExploreURL);

      yield puppeteerPage; //Expose each navigable page only once for different analysis
    }
  }
  return null;
}

type CrawlerResult = {
  requestMethod: string,
  statusCode: 200,
  headers: {
      server: string,
      'content-type': string
      // and other headers
  },
  body: string, // html content
  links: [ // found links in html content, for 301 only one item
      {
          href: string, // value attr href in html page
          url: string // full internal links, for external is false
      }
  ]
}

const explorerV2 = async (urls: string[], method: (res: puppeteer.Page) => void, end: () => void) => {
  let cptUrlDone = 0;

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox']
  });

  urls.forEach(async url => {
    const puppeteerPage = await browser.newPage();

    const crawler = new Crawler(url);
    crawler.crawl();
    crawler.on('data', async (data) => {
      console.log("Exploring ", data.url);
      const res = data.result as CrawlerResult;
      puppeteerPage.setContent(res.body);
      await method(puppeteerPage);
      if (cptUrlDone === urls.length) {
        end();
      }
    });
    crawler.on('error', (error) => console.error(error));
    crawler.on('end', () => {
      ++cptUrlDone
    });
  });
}

const runSEORealTimeRulesAnalyse = async (payload: any): Promise<IRuleResultMessage[]> => {
  const seoAnalyzer = new SeoAnalyzer(RTRules, "");
  return await seoAnalyzer.runRealTimeRules(payload);
}

/**
  * Schedule analysis while exploring pages of given urls
  * @param siteUrls List of website URL to run the tool on; ex: ['https://www.exfabrica.io/', https://kasty.io/]
  * @param features List of analyse to run on selected website; ex: ['SEO', 'Image']
  * @returns Analysis made by selected features on each website
  */
const terminator = async (siteUrls: string[], features: string[]): Promise<ComputedResults> => {
  console.log('Terminator: Sarah Connor ?');
  console.log('Provided URLs => ', siteUrls);
  console.log("Active features ", features);
  console.log("= = = = = = = = = = = = = = =")

  //Init
  const urls = new Set(siteUrls);//Deduplicate urls
  const results = { Sitemap: [], SEO: [], Images: [] } as ComputedResults;

  //Guard clauses for
  if (urls.size > 0 && [...urls].every(isValidUrl)) {
    //Pre-processors

    for await (let pptrPage of explorer([...urls])) {
      //Page is a DOMElement or equivalent exposed by puppeteer
      // const pageName = await pptrPage?.title();
      // console.log("Explorer return a pptrPage name => ", pageName);
      // console.log('Launch Analysis =====>');

      // const selectedFeatures = [];
      // //Setting Analyzers to run
      // if (features.includes('SEO')) {
      //   const seoAnalyzer = new SeoAnalyzer(SEORules, [...urls][0]);
      //   selectedFeatures.push(seoAnalyzer.run(pptrPage));
      // }
      // if (features.includes('Images')) {
      //   const imagesAnalyzer = new ImagesAnalyzer(ImagesRules)
      //   selectedFeatures.push(imagesAnalyzer.run(pptrPage));
      // }

      // const analysis = await Promise.allSettled(selectedFeatures);
      // console.log("Analysis results => ", analysis.map(x => x.status));

      // //Store analysis result for this page by feature
      // categorizedResult(results, pptrPage, analysis, features);
    }

    // await new Promise((res, rej) => {
    //   explorerV2([...urls], async (pptrPage) => {
    //     const pageName = await pptrPage?.title();
    //     console.log("Explorer return a pptrPage name => ", pageName);
    //     // console.log('Launch Analysis =====>');
  
    //     // const selectedFeatures = [];
    //     // //Setting Analyzers to run
    //     // if (features.includes('SEO')) {
    //     //   const seoAnalyzer = new SeoAnalyzer(SEORules, [...urls][0]);
    //     //   selectedFeatures.push(seoAnalyzer.run(pptrPage));
    //     // }
    //     // if (features.includes('Images')) {
    //     //   const imagesAnalyzer = new ImagesAnalyzer(ImagesRules)
    //     //   selectedFeatures.push(imagesAnalyzer.run(pptrPage));
    //     // }
  
    //     // const analysis = await Promise.allSettled(selectedFeatures);
    //     // console.log("Analysis results => ", analysis.map(x => x.status));
  
    //     // //Store analysis result for this page by feature
    //     // categorizedResult(results, pptrPage, analysis, features);
    //   }, () => res(null))
    // })

    //Post process; Consolidate analysis ?

    console.log('Terminator : I’ll be back.');
    return Promise.resolve(results);
  }
  else {
    const err = new Error("URLs provided are not valid")
    return Promise.reject(err);
  }
}

const getAllClickableElementsSelectors = async (page: puppeteer.Page) => {
  return await page.evaluate(async () => {

    const getCssSelector = (el: Element): string => {
      let elm = el
      if (elm.tagName === "BODY") return "BODY";
      const names = [];
      while (elm.parentElement && elm.tagName !== "BODY") {
          if (elm.id) {
              names.unshift("#" + elm.getAttribute("id")); // getAttribute, because `elm.id` could also return a child element with name "id"
              break; // Because ID should be unique, no more is needed. Remove the break, if you always want a full path.
          } else {
              let c = 1, e = elm;
              for (; e.previousElementSibling; e = e.previousElementSibling, c++) ;
              names.unshift(elm.tagName + ":nth-child(" + c + ")");
          }
          elm = elm.parentElement;
      }
      return names.join(">");
    }

    const allElements: Element[] = Array.prototype.slice.call(document.querySelectorAll('*'));
    // allElements.push(document);
    // allElements.push(window);

    // Limit events ??
    const types: string[] = [
      "onclick",
      "onmousedown",
      "onmouseup",
    ];

    let selectors: string[] = [];
    for (let i = 0; i < allElements.length; i++) {
      const currentElement = allElements[i];

      // Events defined in attributes
      for (let j = 0; j < types.length; j++) {
        if (typeof currentElement[types[j]] === 'function') {
          selectors.push(getCssSelector(currentElement));
          break;
        }
      }

      // Events defined with addEventListener
      //@ts-ignore
      let listeners = currentElement._getEventListeners
      if (typeof listeners === 'function') {
        const evts = listeners();
        if (Object.keys(evts).length >0) {
          listenerFor: for (let evt of Object.keys(evts)) {
            for (let k=0; k < evts[evt].length; k++) {
              selectors.push(getCssSelector(currentElement));
              break listenerFor;
            }
          }
        }
      }
    }

    const allLinks: Element[] = Array.prototype.slice.call(document.querySelectorAll('a:not([href])'));
    selectors = [...selectors, ...allLinks.map(x => getCssSelector(x))]

    return selectors
      .filter(x => x !== "BODY")
      .sort();
  })
}

type ClickableElement = {
  elem: puppeteer.ElementHandle<Element>,
  content: string,
  selector?: string,
}

type NavigationElement = {
  content: string,
  tagName: string,
  className: string,
  url: string,
}

type NavigatedElement = {
  selector: string,
  content: string
}

const getAllClickables = async (page: puppeteer.Page): Promise<ClickableElement[]> => {
  const elementsSelector = await getAllClickableElementsSelectors(page)
  let allButtons = (await Promise.all(elementsSelector.map(async x => {
    const elem = (await page.$(x))
    return elem ? {
      elem,
      content: (await (await elem.getProperty('innerText')).jsonValue() || await (await elem.getProperty('innerHTML')).jsonValue()) as string,
      selector: x,
    } : null
  }))).filter(x => !!x)

  // let allButtons = (await page.$$('button')) // TODO replace : find all elements with events (onClick, onMouseDown, onMouseUp)
  // Remove all buttons with "a" inside
  for (let i = 0 ; i < allButtons.length ; ) {
    const href: string = await (await allButtons[i].elem.getProperty('href')).jsonValue()
    if (href || !!(await allButtons[i].elem.$('a'))) {
      allButtons.splice(i, 1);
      continue;
    }
    ++i;
  }

  return allButtons;
}

const tryClickOnElement = async (page: puppeteer.Page, currentElement: ClickableElement): Promise<NavigationElement | boolean> => {
  const previousUrl = page.url();
  const tagName: string = await (await currentElement.elem.getProperty('tagName')).jsonValue()
  const className: string = await (await currentElement.elem.getProperty('className')).jsonValue()
  // console.debug("Click will be on <" + tagName + "> " + currentElement.content)
  const [navigation, _] = await Promise.allSettled([
    page.waitForNavigation({
      timeout: 1500, // Arbitrary ??
    }),
    currentElement.elem.click(),
  ])
  // TODO try to click on non-event images ?? => "noop" function, mais pas que sur les images (les vraies actions comme les menus aussi) => comment détecter ?
  // console.debug(page.url())
  let result: NavigationElement | boolean = false
  if (navigation.status === 'fulfilled') {
    const newUrl = page.url();
    console.debug('Found onclick navigation: ' + newUrl);
    result = {
      content: currentElement.content,
      tagName,
      className,
      url: newUrl,
    }
    await page.goto(previousUrl, { waitUntil: 'domcontentloaded' })
  }
  return result
}

const listHiddenNavigationElements = async (page: puppeteer.Page, elementsDone: NavigatedElement[]): Promise<NavigationElement[]> => {
  let elemCount: number = 0;
  let navigationElements: NavigationElement[] = [];
  
  let currentElements = await getAllClickables(page); // Do it on loop because the page content may change after clicks
  let allElements: NavigatedElement[] = []
  // TODO gestion des next / previous KO => idée : s'occuper du contenu qui a changé suite à un clic AVANT de recliquer sur l'élément puis le reste
  
  while(true) {
    const newElementToClick = currentElements.find(x => !elementsDone.find(y => x.content === y.content && x.selector === y.selector))
    if (!newElementToClick) break;
    console.debug("Click " + elemCount++);
    const foundNavElement = await tryClickOnElement(page, newElementToClick);
    if (!!foundNavElement) {
      navigationElements.push(foundNavElement as NavigationElement)
    }
    const newAllElements = await getAllClickables(page); // Do it on loop because the page content may change after clicks
    // If the page doesn't change (we know it because there is no navigation or unknown buttons)
    if (!!foundNavElement || 
        newAllElements.filter(x => allElements.find(y => x.selector === y.selector && x.content === y.content)).length === newAllElements.length
    ) {
      elementsDone.push({ selector: newElementToClick.selector, content: newElementToClick.content })
    }
    currentElements = newAllElements
    allElements.push(
      ...newAllElements
        .filter(x => !allElements.find(y => x.selector === y.selector && x.content === y.content))
        .map(x => ({ selector: x.selector, content: x.content }))
    )
  }

  return navigationElements.sort();
};

export { terminator, runSEORealTimeRulesAnalyse }
