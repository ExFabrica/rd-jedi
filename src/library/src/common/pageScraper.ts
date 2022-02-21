import puppeteer from "puppeteer";
  
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

type ElementTarget = {
  selector: string,
  content: string
}

/**
 * Get all selectors for clickable elements on a page
 * @param page The page to test
 * @returns A list of CSS selectors
 */
const getAllClickableElementsSelectors = async (page: puppeteer.Page): Promise<string[]> => {
  // Using "page.evaluate" to find event listeners
  return await page.evaluate(async () => {

    /**
     * Get the CSS selector for an element.
     * Defined here because used inside "page.evaluate"
     * @param el The targeted element
     * @returns The CSS selector, as a string. Example: `#id>div:nth-child(3)>div:nth-child(1)`
     */
    const getCssSelector = (el: Element): string => {
      let elm = el
      if (elm.tagName === "BODY") return "BODY";
      const names = [];
      while (elm.parentElement && elm.tagName !== "BODY") {
        const id = elm.getAttribute("id")
          if (id) {
            names.unshift(`#${id}`);
            break; // Because ID should be unique, no more is needed. Remove the break, if you always want a full path.
          } else {
            // Count similar elements on the same level
            let cpt = 1, e = elm;
            for (; e.previousElementSibling; e = e.previousElementSibling, cpt++) ;
            names.unshift(`${elm.tagName}:nth-child(${cpt})`);
          }
          elm = elm.parentElement;
      }
      return names.join(">");
    }

    const allElements: Element[] = Array.prototype.slice.call(document.querySelectorAll('*'));

    // Add more events ??
    const types: string[] = [
      "onclick",
      "onmousedown",
      "onmouseup",
    ];

    let clickableSelectors: string[] = allElements
      .filter(elem => 
        !!types.find(t => typeof elem[t] === 'function') // Events defined in attributes
        //@ts-ignore to make _getEventListeners works
        || (typeof elem._getEventListeners === 'function' && Object.keys(elem._getEventListeners()).length > 0) // Events defined with addEventListener
      )
      .map(elem => getCssSelector(elem))

    const allLinks: Element[] = Array.prototype.slice.call(document.querySelectorAll('a:not([href])'));
    clickableSelectors = [...clickableSelectors, ...allLinks.map(x => getCssSelector(x))]

    return clickableSelectors
      .filter(x => x !== "BODY")
      .sort();
  })
}

/**
 * Get all unique clickable elements on the page
 * @param page Page to test
 * @returns A list a clickable elements
 */
const getAllUniqueClickables = async (page: puppeteer.Page): Promise<ClickableElement[]> => {
  console.log(`Looking for all clickable elements for page ${page.url()}`)
  try {
    const elementsSelector = await getAllClickableElementsSelectors(page)
    let allButtons: ClickableElement[] = []
    for (let i = 0 ; i < elementsSelector.length ; ++i) {
      const elem = (await page.$(elementsSelector[i]))
      if (elem) {
        // Don't add clickables with "a" inside => the "a" is already clickable
        const asInnerLink = (await (await elem.getProperty('href')).jsonValue()) || !!(await elem.$('a'))
        if (!asInnerLink) {
          allButtons.push({
            elem,
            content: (await (await elem.getProperty('innerText')).jsonValue()) as string,
            selector: elementsSelector[i],
          })
        }
      }
    }
    return allButtons;
  } catch(e) {
    console.error(`Error while getting clickables on page ${page.url()}`, e)
    return []
  }
}

/**
 * Try to click on an element, and look if a new page is rendered
 * @param page The page to test
 * @param currentElement The element to test
 * @param timeout The timeout for the navigation detection on click
 * @returns If a new page is rendered, the element clicked with the url. Else, false.
 */
const tryClickOnElement = async (page: puppeteer.Page, currentElement: ClickableElement, timeout: number): Promise<NavigationElement | boolean> => {
  const previousUrl = page.url();
  const tagName: string = await (await currentElement.elem.getProperty('tagName')).jsonValue()
  const className: string = await (await currentElement.elem.getProperty('className')).jsonValue()
  console.debug(`Click on <${tagName}>`)
  // console.debug("Click will be on <" + tagName + "> " + currentElement.content)
  await Promise.allSettled([
    page.waitForNavigation({
      timeout: timeout,
    }),
    currentElement.elem.click(),
  ])
  // TODO try not to click on non-event images, for performance => there are "noop" functions, doing nothing
  // We can't filter on "noop" function because somes functions are not empty (i.e on menus)
  // => How to detect ???
  let result: NavigationElement | boolean = false
  const newUrl = page.url();
  if (newUrl !== previousUrl) {
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

/**
 * Find all navigation elements other than '<a href="...">' by clicking on every clickable elements on the page
 * @param page The page to test
 * @param elementsDone The already found elements, to not click again on them
 * @param navigationTestTimeout The timeout for the navigation detection on click
 * @yields Navigation element found
 */
const findHiddenNavigationElements = async function* (page: puppeteer.Page, elementsDone: ElementTarget[], navigationTestTimeout: number) {
  let currentElements = await getAllUniqueClickables(page);
  let allElements: ElementTarget[] = []

  // Click on all elements found on the page, event if modified as much as possible
  // Doesn't work on paginated lists, but we don't care
  const initialUrl = page.url();
  try {
    while(true) {
      const newElementToClick = currentElements.find(x => !elementsDone.find(y => x.content === y.content && x.selector === y.selector))
      if (!newElementToClick) break; // Stop when no new element found

      const foundNavElement = await tryClickOnElement(page, newElementToClick, navigationTestTimeout);
      if (!!foundNavElement) {
        yield foundNavElement as NavigationElement
      }
      const newAllElements = await getAllUniqueClickables(page); // Do it on loop because the page content may change after clicks
      // If the page doesn't change (we know it because there is no navigation or unknown clickables)
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
  } catch(e) {
    console.error(`Error while clicking elements of page ${initialUrl}`, e);
    // If any error, try to go back to the initial page
    await page.goto(initialUrl, { waitUntil: 'domcontentloaded' })
  }
};

export {
  ElementTarget,
  NavigationElement,
  findHiddenNavigationElements
}