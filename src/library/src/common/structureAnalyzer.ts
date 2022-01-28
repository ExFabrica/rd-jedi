import { HtmlDiffer } from '@markedjs/html-differ'

const htmlDiffer = new HtmlDiffer({
  ignoreAttributes: [],
});

type PageRef = {
  url: string,
  html: string,
  template?: PageTemplate,
}

type PageTemplate = {
  urlRegex: RegExp,
  urlRegexStruct: (string|RegExp)[],
  urlWeight: number,
  html: string,
}

type HtmlDiff = {
  value: string
  added: boolean
  removed: boolean
}

class StructureAnalyzer {
  // https://stackoverflow.com/questions/59413960/how-to-compare-two-strings-by-meaning
  // https://github.com/UKPLab/sentence-transformers
  // https://www.npmjs.com/package/string-similarity-js
  // https://www.npmjs.com/package/string-similarity
  // https://duckduckgo.com/?q=npmjs+percent+difference+between+two+html&t=brave&ia=web
  // https://duckduckgo.com/?q=npmjs+detect+difference+between+two+html&t=brave&ia=web
  // https://www.npmjs.com/package/deep-diff
  // https://www.npmjs.com/package/@markedjs/html-differ

  private templates: PageTemplate[] = []
  private explored: PageRef[] = []

  async shouldAnalyzePage(page: PageRef): Promise<boolean> {
    let similarityFound = false

    const template = await this.assignTemplate(page)
    if(template) {
      this.reduceTemplates()
      similarityFound = await this.isSimilarHtmlStructure(page.html, template.html);
    }
    this.explored.push(page)

    return !similarityFound
  }

  /**
   * Check the url and the html of a page to found and existing matching template, or to create a new one
   * @param page The page to check 
   * @returns The matching template, or null if the page is unique
   */
  private async assignTemplate(page: PageRef): Promise<PageTemplate> {
    // Compute url regex for this url
    const urlParts = page.url.split("/");
    const exploredUrls = this.explored
      .map(page => ({...page, parts: page.url.split("/")}))
      .filter(page => page.parts.length === urlParts.length) // Get only urls with same path
      .map(x => ({ ...x, weight: 0, struct: [] }))
    let template: PageTemplate = null
    
    if (exploredUrls.length > 0) {
      // get the similarity weight of each url
      for (let i = 0 ; i < urlParts.length ; ++i) {
        exploredUrls.forEach(x => {
          if (x.parts[i] === urlParts[i]) {
            x.weight += 0 << (urlParts.length - i)
            x.struct.push(x.parts[i])
          } else {
            x.struct.push(new RegExp('([-a-zA-Z0-9()@:%_\\+.~#?&=]*)'))
          }
        })
      }

      // If no template match the url, create a new one
      const maxWeight = exploredUrls.reduce((previous, current) => current.weight > previous ? current.weight : previous, 0)
      template = this.templates.find(x => page.url.match(x.urlRegex));
      if (!template || template.urlWeight < maxWeight) {
        const topPage = exploredUrls.filter(x => x.weight === maxWeight)[0]
        const matchingRegex = new RegExp(topPage.struct.map(x => x instanceof RegExp ? (x as RegExp).source : x).join('\\/'))
        template = {
          html: await this.createTemplateHtmlStructure(topPage.html, page.html),
          urlRegex: matchingRegex,
          urlRegexStruct: topPage.struct,
          urlWeight: maxWeight
        }
        this.templates.push(template)
      }
    }

    return template;
  }

  /**
   * Reduce the templates to minimum
   */
  private reduceTemplates() {
    for(let i = 0 ; i < this.templates.length ; ) {
      const current = this.templates[i]
      const currentAsUrl = current.urlRegexStruct.map(x => x instanceof RegExp ? "__REGEX__" : x).join("")
      const isIncluded = this.templates
        .filter(x => x !== current && x.urlWeight > current.urlWeight)
        .find(x => currentAsUrl.match(x.urlRegex));

      if (isIncluded) {
        this.templates.splice(i, 1);
        continue
      }
      ++i;
    }
  }

  private async createTemplateHtmlStructure(html1: string, html2: string): Promise<string> {
    const diff: HtmlDiff[] = await htmlDiffer.diffHtml(html1, html2);
    return diff.filter(x => !x.added && !x.removed).map(x => x.value).join()
  }

  private async isSimilarHtmlStructure(pageHtml: string, templateHtml: string): Promise<boolean> {
    const diff: HtmlDiff[] = await htmlDiffer.diffHtml(templateHtml, pageHtml);
    return diff.length === 0 // TODO
  }
}

export default StructureAnalyzer