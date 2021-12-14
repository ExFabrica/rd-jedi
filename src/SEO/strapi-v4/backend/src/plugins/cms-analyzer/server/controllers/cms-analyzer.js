'use strict';
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
      contentTypes = await strapi.service('plugin::cms-analyzer.cmsAnalyzer').getContentTypes();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(contentTypes);
  },
  getContents: async (ctx) => {
    let contents = {};
    try {
      contents = await strapi.service('plugin::cms-analyzer.cmsAnalyzer').getContents();
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
      documents = await strapi.services[api].find(ctx);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(documents);
  },
  runConsolidation: async (ctx) => {
    // remove url property from context
    const { url } = ctx.query;
    delete ctx.query['url'];
    let result = {};
    try {
      result = await strapi.service('plugin::cms-analyzer.cmsAnalyzer').runConsolidationProcess(url);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(result);
  },
  runRealTimeRulesAnalyze: async (ctx) => {
    let result;
    // remove url property from context
    const { body } = ctx.request;
    try {
      result = await strapi.service('plugin::cms-analyzer.cmsAnalyzer').runRealTimeRulesAnalyze(body);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(result);
  },
  getSettings: async (ctx) => {
    let config = {};
    try {
      config = await strapi.service('plugin::cms-analyzer.cmsAnalyzer').getSettings();
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
      await strapi.service('plugin::cms-analyzer.cmsAnalyzer').setSettings(body);
      config = await strapi.service('plugin::cms-analyzer.cmsAnalyzer').getSettings();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(config);
  }
};
