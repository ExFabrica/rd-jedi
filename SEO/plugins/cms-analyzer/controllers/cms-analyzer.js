'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const analyserService = require('../services/cms-analyzer');
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
      contentTypes = await analyserService.getContentTypes();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(contentTypes);
  },
  getContents: async (ctx) => {
    let contents = {};
    try {
      contents = await analyserService.getContents();
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
  getAnalyzer: async (ctx) => {
    const { url } = ctx.query;
    let result;
    try {
      result = await analyzer(url);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(result);
  },
  runConsolidation: async (ctx) => {
    // remove url property from context
    const { url } = ctx.query;
    delete ctx.query['url'];
    let result = {};
    try {
      result = await analyserService.runConsolidationProcess(url);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(result);
  },
  getSettings: async (ctx) => {
    let config = {};
    try {
      config = await analyserService.getSettings();
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
      await analyserService.setSettings(body);
      config = await analyserService.getSettings();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(config);
  }
};
