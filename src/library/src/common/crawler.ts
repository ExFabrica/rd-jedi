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

type NavigatedElement = {
  selector: string,
  content: string
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
  // TODO try not to click on non-event images, for performance => there are "noop" functions, doing nothing
  // We can't filter on "noop" function because somes functions are not empty (i.e on menus)
  // => How to detect ???
  // console.debug(page.url())
  let result: NavigationElement | boolean = false
  if (navigation.status === 'fulfilled') {
    const newUrl = page.url();
    // console.debug('Found onclick navigation: ' + newUrl);
    process.stdout.moveCursor(-1, 0)
    process.stdout.write('!')
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
  let navigationElements: NavigationElement[] = [];
  
  let currentElements = await getAllClickables(page);
  let allElements: NavigatedElement[] = []

  // Click on all elements found on the page, event if modified as much as possible
  // Doesn't work on paginated lists, but we don't care
  while(true) {
    const newElementToClick = currentElements.find(x => !elementsDone.find(y => x.content === y.content && x.selector === y.selector))
    if (!newElementToClick) break;
    process.stdout.write(".")
    const foundNavElement = await tryClickOnElement(page, newElementToClick);
    if (!!foundNavElement) {
      navigationElements.push(foundNavElement as NavigationElement)
    }
    const newAllElements = await getAllClickables(page); // Do it on loop because the page content may change after clicks
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
  process.stdout.write("\n")

  return navigationElements.sort();
};

export {
  NavigatedElement,
  NavigationElement,
  listHiddenNavigationElements
}