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

/**
 * Get all unique clickable elements on the page
 * @param page Page to test
 * @returns A list a clickable elements
 */
const getAllUniqueClickables = async (page: puppeteer.Page): Promise<ClickableElement[]> => {
  const elementsSelector = await getAllClickableElementsSelectors(page)
  let allButtons = (await Promise.all(elementsSelector.map(async x => {
    const elem = (await page.$(x))
    return elem ? {
      elem,
      content: (await (await elem.getProperty('innerText')).jsonValue()) as string,
      selector: x,
    } : null
  }))).filter(x => !!x)

  // Remove all clickables with "a" inside => the "a" is already clickable
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

/**
 * Try to click on an element, and look if a new page is rendered
 * @param page The page to test
 * @param currentElement The element to test
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
      timeout: timeout, // TODO Arbitrary ??
    }),
    currentElement.elem.click(),
  ])
  // TODO try not to click on non-event images, for performance => there are "noop" functions, doing nothing
  // We can't filter on "noop" function because somes functions are not empty (i.e on menus)
  // => How to detect ???
  // console.debug(page.url())
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
 * @returns A list of navigation elemnts
 */
const findHiddenNavigationElements = async function* (page: puppeteer.Page, elementsDone: ElementTarget[], navigationTimeout: number) {
  let currentElements = await getAllUniqueClickables(page);
  let allElements: ElementTarget[] = []

  // Click on all elements found on the page, event if modified as much as possible
  // Doesn't work on paginated lists, but we don't care
  while(true) {
    const newElementToClick = currentElements.find(x => !elementsDone.find(y => x.content === y.content && x.selector === y.selector))
    if (!newElementToClick) break;
    const foundNavElement = await tryClickOnElement(page, newElementToClick, navigationTimeout);
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
};

export {
  ElementTarget,
  NavigationElement,
  findHiddenNavigationElements
}