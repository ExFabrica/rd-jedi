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
  getConsolidation: async (ctx) => {
    await strapi.plugins["cms-analyzer"].services.analyse.deleteAll();
    const { url } = ctx.query;
    delete ctx.query['url'];
    const rs = await analyzer(url);

    const contents = await service.getContents();
    let documentsByApiName = [];

    for (const content of contents) {
      const contentDocuments = await strapi.controllers[content.apiName].find(ctx);
      if(contentDocuments)
        documentsByApiName = _.concat(documentsByApiName, { apiName: content.apiName, documents: _.isArray(contentDocuments) ? contentDocuments : [contentDocuments] });
    }
    documentsByApiName = _.uniqBy(documentsByApiName, "apiName");

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
        }
        page.tags = stringTags;
        pages.push(page);
      }
    }

    let results = [];
    // First Step -> regognize on simple text comparator
    for (const page of pages) {
      for (const tag of page.tags) {
        for (const content of contents) {
          const filteredByApiName = documentsByApiName.filter(item => item.apiName === content.apiName);
          if (filteredByApiName && filteredByApiName.length > 0 && filteredByApiName[0] && filteredByApiName[0].documents && filteredByApiName[0].documents.length > 0) {
            const documents = filteredByApiName[0].documents;
            for (const document of documents) {
              for (const attribute of content.attributes) {
                let attributeValue = document[attribute.key];
                if (attribute.key.indexOf('.') > -1) {
                  const splitedKeyName = attribute.key.split('.');
                  attributeValue = document[splitedKeyName[0]][splitedKeyName[1]];
                }
                if (attributeValue && tag.innerText) {
                  if (attributeValue.toLowerCase() === tag.innerText.toLowerCase()) {
                    var item = _.find(results, { frontUrl: page.url });
                    if (!item)
                      results.push(
                        {
                          uid: `${document.id}-${page.uid}`,
                          apiName: content.apiName,
                          frontUrl: page.url,
                          documentId: document.id,
                          documentFields: [{ key: attribute.key, value: attributeValue }],
                          seoAnalyse: page.seoAnalyse
                        });
                    else {
                      item.documentFields.push({ key: attribute.key, value: attributeValue });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    //strapi.plugins["cms-analyzer"].controllers["cms-analyzer"].put()
    for (const result of results) {
      await strapi.plugins["cms-analyzer"].services.analyse.create({
        uid: result.uid,
        apiName: result.apiName,
        frontUrl: result.frontUrl,
        documentId: result.documentId,
        seoAnalyse: JSON.stringify(result.seoAnalyse ? result.seoAnalyse : {}),
        documentFields: JSON.stringify(result.documentFields ? result.documentFields : {})
      })
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
