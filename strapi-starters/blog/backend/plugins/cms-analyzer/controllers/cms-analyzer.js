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
    const { url } = ctx.query;
    delete ctx.query['url'];
    const rs = await analyzer(url);

    const contents = await service.getContents();
    let documentsByApiName = [];

    for (const content of contents) {
      const contentDocuments = await strapi.controllers[content.apiName].find(ctx);
      documentsByApiName = _.concat(documentsByApiName, { apiName: content.apiName, documents: contentDocuments });
    }
    documentsByApiName = _.uniqBy(documentsByApiName, "apiName");
    //console.log("documents", documentsByApiName);

    let results = [];
    // First Step -> regognize on simple text comparator
    for (const page of rs.results) {
      const textContents = _.uniq(page.results.filter(item => item.content && !item.content.includes("http")).map(item => item.content));
      /*console.log("**************************************************");*/
      if (textContents && textContents.length > 0) {
        console.log("textContents", textContents);
        for (const textContent of textContents) {
          for (const content of contents) {
            const filteredByApiName = documentsByApiName.filter(item => item.apiName === content.apiName);
            if (filteredByApiName && filteredByApiName.length > 0 && filteredByApiName[0] && filteredByApiName[0].documents && filteredByApiName[0].documents.length > 0) {
              const documents = [...filteredByApiName[0].documents];
              for (const document of documents) {
                for (const attribute of content.attributes) {
                  //console.log('content.attributes', content.attributes, content.apiName);
                  if (document[attribute.key] && textContent) {
                    if (document[attribute.key].toLowerCase() === textContent.toLowerCase()) {
                      //console.log("pushed => ", attribute.key, document[attribute.key], content.apiName)
                      var item = _.find(results, { url: page.url });
                      if (!item)
                        results.push({ url: page.url, document, seo: page.results, key: [attribute.key], value: [document[attribute.key]] });
                      else {
                        item.key.push(attribute.key);
                        item.value.push(document[attribute.key]);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Second step -> consolidate the page.
    //_.uniqBy(result, 'url');

    return results
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
