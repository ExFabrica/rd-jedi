import * as Diff from 'diff'

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

type PageRegex = {
  struct: (string|RegExp)[],
  weight: number,
  html: string,
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

    const matchingRegex = this.findMatchingRegex(page)
    if (matchingRegex.length > 0) {
      const template = await this.findTemplate(page, matchingRegex)
      if(template) {
        console.log("Find similar page. Regex: " + template.urlRegex.source)
        similarityFound = true
      } else {
        const newTemplate = await this.assignTemplate(page, matchingRegex)
        if (newTemplate) {
          this.templates.push(newTemplate)
          console.log("New template created. Regex: " + newTemplate.urlRegex.source)
          this.reduceTemplates()
          similarityFound = true
        }
      }
    }
    this.explored.push(page)

    return !similarityFound
  }

  private findMatchingRegex(page: PageRef): PageRegex[] {
    const urlParts = page.url.split("/");
    const exploredUrls = this.explored
      .map(page => ({...page, parts: page.url.split("/")}))
      .filter(page => page.parts.length === urlParts.length) // Get only urls with same path
      .map(x => ({ ...x, weight: 0, struct: [] }))
      
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
    }

    return exploredUrls
  }

  private async findTemplate(page: PageRef, matchingRegex: PageRegex[]): Promise<PageTemplate> {
    let template: PageTemplate = null
    
    if (matchingRegex.length > 0) {
      const maxWeight = matchingRegex.reduce((previous, current) => current.weight > previous ? current.weight : previous, 0)
      template = this.templates.find(x => page.url.match(x.urlRegex));
      if (template && template.urlWeight === maxWeight) {
        console.log(`Comparing "${page.url}" to "${template.urlRegex.source}"`)
        const similarityFound = await this.isSimilarHtmlStructure(page.html, template.html);
        if (!similarityFound) {
          template = null
        }
      } else {
        template = null
      }
    }

    return template;
  }

  private async assignTemplate(page: PageRef, matchingRegex: PageRegex[]): Promise<PageTemplate> {
    // Compute url regex for this url
    let template: PageTemplate = null
    
    if (matchingRegex.length > 0) {
      // If no template match the url, create a new one
      const maxWeight = matchingRegex.reduce((previous, current) => current.weight > previous ? current.weight : previous, 0)
      const topPage = matchingRegex.filter(x => x.weight === maxWeight)[0]
      const structure = await this.createTemplateHtmlStructure(topPage.html, page.html)
      if (structure) {
        const urlRegex = new RegExp(topPage.struct.map(x => x instanceof RegExp ? (x as RegExp).source : x).join('\\/'))
        template = {
          html: structure,
          urlRegex: urlRegex,
          urlRegexStruct: topPage.struct,
          urlWeight: maxWeight
        }
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
    console.log("Diff html to create...")
    console.log(`Sizes: ${html1.length / 1024} / ${html2.length / 1024}`)
    const diff: HtmlDiff[] = await Diff.diffChars(html1, html2);
    console.log("OK !")
    const templated = diff.filter(x => !x.added && !x.removed)
    const minSimilarity = 0.8 // If more of 80% of the page is different, consider it as an other page
    if (templated.length < diff.length * minSimilarity) {
      return null
    }
    return templated.map(x => x.value).join()
  }

  private async isSimilarHtmlStructure(pageHtml: string, templateHtml: string): Promise<boolean> {
    console.log("Diff html to compare...")
    console.log(`Sizes: ${pageHtml.length / 1024} / ${templateHtml.length / 1024}`)
    const diff: HtmlDiff[] = await Diff.diffChars(templateHtml, pageHtml);
    console.log("OK !")
    return diff.filter(x => x.removed).length === 0 // TODO
  }
}

export default StructureAnalyzer