'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const service = require('../services/cms-analyzer');
const _ = require('lodash');
/**
 * cms-analyzer.js controller
 *
 * @description: A set of functions called "actions" of the `cms-analyzer` plugin.
 */

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */

  getContentTypes: async (ctx) => {
    let contentTypes = {};
    try {
      contentTypes = await service.getContentTypes();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(contentTypes);
  },
  getContents: async (ctx) => {
    let contents = {};
    try {
      contents = await service.getContents();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(contents);
  },
  getDocuments: async (ctx) => {
    const { api } = ctx.query;
    delete ctx.query['api'];
    let documents = {};
    try {
      documents = await strapi.controllers[api].find(ctx);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(documents);
  },
  getAnalyzer: async (ctx) => {
    const { url } = ctx.query;
    const result = await analyzer(url);
    ctx.send(result);
  },
  _getStrapiDocumentsByApiName: async (ctx) => {
    const contents = await service.getContents();
    let documentsByApiName = [];
    for (const content of contents) {
      const contentDocuments = await strapi.controllers[content.apiName].find(ctx);
      if (contentDocuments)
        documentsByApiName = _.concat(documentsByApiName,
          {
            apiName: content.apiName,
            documents: _.isArray(contentDocuments) ? contentDocuments : [contentDocuments],
            attributes: content.attributes
          });
    }
    return documentsByApiName;
  },
  _getAnalyzedPages: async (url) => {
    const rs = await analyzer(url);
    let pages = [];
    for (const url of rs.sitemap) {
      const foundPages = rs.results.filter(item => item.url === url);
      if (foundPages && foundPages.length > 0) {
        let page = { uid: foundPages[0].uid, url: url, tags: [], seoAnalyse: foundPages[0].results };
        let stringTags = [];
        const tags = foundPages[0].tags;
        if (tags) {
          const description = tags.meta.filter(item => item.name === "description");
          stringTags = _.concat(stringTags, tags.title);
          if (description && description.length > 0)
            stringTags = _.concat(stringTags, description[0]);
          stringTags = _.concat(stringTags, tags.h1s);
          stringTags = _.concat(stringTags, tags.h2s);
          stringTags = _.concat(stringTags, tags.h3s);
          stringTags = _.concat(stringTags, tags.h4s);
          stringTags = _.concat(stringTags, tags.h5s);
          stringTags = _.concat(stringTags, tags.h6s);
          //stringTags = _.concat(stringTags, tags.ps);
        }
        page.tags = stringTags;
        pages.push(page);
      }
    }
    return pages;
  },
  _getAttributeComparaison: (results, page, apiName, document, attributeKey, tag) => {
    let attributeValue = document[attributeKey];
    if (attributeKey.indexOf('.') > -1) {
      const splitedKeyName = attributeKey.split('.');
      attributeValue = document[splitedKeyName[0]][splitedKeyName[1]];
    }
    const text = tag.tag === "meta" ? tag.content : tag.innerText;

    if (attributeValue && text) {
      let comparaison = attributeValue.length > text.length ?
        attributeValue.toLowerCase().includes(text.toLowerCase()) :
        text.toLowerCase().includes(attributeValue.toLowerCase());

      //_.startsWith(attributeValue.toLowerCase(), text.toLowerCase())
      //: _.startsWith(text.toLowerCase(), attributeValue.toLowerCase());

      if (comparaison) {
        const item = _.find(results, { frontUrl: page.url });
        if (!item)
          results.push(
            {
              apiNames: [apiName],
              frontUrl: page.url,
              documentId: document.id,
              documentFields: [{ key: attributeKey, value: attributeValue, from: apiName, tag: tag.tag }],
              seoAnalyse: page.seoAnalyse,
            });
        else {
          let field = _.find(item.documentFields, { key: attributeKey, from: apiName });
          if (!field) {
            item.documentFields.push({ key: attributeKey, value: attributeValue, from: apiName, tag: tag.tag });
            if (!item.apiNames.includes(apiName))
              item.apiNames.push(apiName);
          }
        }
      }
    }
    return results;
  },
  _pushResultInCollection: async (results) => {
    for (const result of results) {
      await strapi.plugins["cms-analyzer"].services.analyse.create({
        apiNames: JSON.stringify(result.apiNames ? result.apiNames : {}),
        frontUrl: result.frontUrl,
        documentId: result.documentId,
        seoAnalyse: JSON.stringify(result.seoAnalyse ? result.seoAnalyse : {}),
        documentFields: JSON.stringify(result.documentFields ? result.documentFields : {})
      });
    }
  },
  getConsolidation: async (ctx) => {
    // Delete all documents in strapi collection
    await strapi.plugins["cms-analyzer"].services.analyse.deleteAll();
    await strapi.plugins["cms-analyzer"].services.link.deleteAll();
    // remove url property from context
    const { url } = ctx.query;
    delete ctx.query['url'];

    // Get documents and attributes sorted by apiName
    const strapiDocumentsByApiName = await module.exports._getStrapiDocumentsByApiName(ctx);
    // Get pages from analyzer
    const pages = await module.exports._getAnalyzedPages(url);

    // Iterate on pages and documents to match data
    let results = [];
    let fields = [];
    for (const page of pages) {
      for (const tag of page.tags) {
        for (const documentByApiName of strapiDocumentsByApiName) {
          for (const document of documentByApiName.documents) {
            for (const attribute of documentByApiName.attributes) {
              results = module.exports._getAttributeComparaison(results, page, documentByApiName.apiName, document, attribute.key, tag);
            }
          }
        }
      }
    }

    //Put founded data in plugin collection
    await module.exports._pushResultInCollection(results);

    //Work on result to extract relations ships between front tags and Strapi fields
    let fieldResults = {};
    for (const result of results) {
      fields = _.concat(fields, result.documentFields);
      fields = _.uniq(fields);
      fieldResults = fields.reduce((acc, curVal) => {
        if (!acc.hasOwnProperty(curVal.from))
          acc[curVal.from] = {};
        if (!acc[curVal.from].hasOwnProperty(curVal.key))
          acc[curVal.from][curVal.key] = curVal.tag;
        return acc;
      }, {});
    }

    for (const property in fieldResults) {
      for (const innerProperty in fieldResults[property]) {
        await strapi.plugins["cms-analyzer"].services.link.create({
          apiName: property,
          tag: fieldResults[property][innerProperty],
          field: innerProperty,
        });
      }
    }

    return results;
  },
  getSettings: async (ctx) => {
    let config = {};
    try {
      config = await strapi.plugins["cms-analyzer"].services["cms-analyzer"].getSettings();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(config);
  },
  setSettings: async (ctx) => {
    let config = {};
    const { body } = ctx.request;
    try {
      await strapi.plugins["cms-analyzer"].services["cms-analyzer"].setSettings(body);
      config = await strapi.plugins["cms-analyzer"].services["cms-analyzer"].getSettings();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(config);
  }
};
