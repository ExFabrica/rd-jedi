import puppeteer from 'puppeteer';
import { IPageResult, IImagesRetrived, IImagesRetriver } from './models/interfaces';
import { IRule } from '../common/models/rule.interfaces';

function uuid() {
  return "00000000-0000-4000-8000-000000000000".replace(/0/g, function () { return (0 | Math.random() * 16).toString(16) })
}

export class ImagesAnalyzer {
  private rulesToUse: IRule[];

  public constructor(private rules: IRule[]) {
    this.rulesToUse = this.rules.length > 0 ? this.rules : []
  }

  private async getImgTags(page: puppeteer.Page): Promise<IImagesRetrived[]> {
    return page.$$eval('img', imgs => imgs.map(img => {
      return {
        src: img.getAttribute('src'),
        srcset: img.getAttribute('srcset'),
        sizes: img.getAttribute('sizes'),
        height: img.clientHeight,
        width: img.clientWidth,
        alt: img.getAttribute('alt')}
    }));
  }

  private async getInsideDomImages(page: puppeteer.Page): Promise<IImagesRetriver> {
    try {
      console.debug("Begin - Get images inside DOM");
      const images = await this.getImgTags(page)
      
      console.debug("End - Get images inside DOM");
      return { images };
    }
    catch (err) {
      throw err;
    }
  }

  private async getOutsideDomImages(page: puppeteer.Page): Promise<IImagesRetriver> {
    try {
      console.debug("Begin - Get images outside DOM");
      const images = [];
      //Get Outside DOM images
      //TODO: Use page.eval to execute previous démo script and retrive all CSS images
      console.debug("End - Get images outside DOM");
      return { images };
    }
    catch (err) {
      throw err;
    }
  }

  public async run(page: puppeteer.Page): Promise<IPageResult> {
    try {
      console.debug("Begin - Images Main process");
      //First step - retrive images inside the DOM
      const imagesInside = await this.getInsideDomImages(page);
      //Second step - retrive images from CSS (outside DOM)
      const imagesOutside = await this.getOutsideDomImages(page);
      const aggregateImages = [...imagesInside.images, ...imagesOutside.images]
      console.debug("End - Images Main process");
      return { type: "Images", result: {uid: uuid(), url: page.url(), images: aggregateImages } };
    }
    catch (err) {
      console.debug("Err: Images Main process", err);
      throw err;
    }
  }
};