'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const service = require('../services/cms-analyzer');

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
  getCollections: async (ctx) => {
    let contentTypes = {};
    try {
      contentTypes = await service.getCollections();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(contentTypes);
  },
  getDocumentsFromApi: async (ctx) => {
    const {api} = ctx.query;
    delete ctx.query['api'];
    let articles = {};
    let models = {};
    try {
      articles = await strapi.controllers[api].find(ctx);
      models = await strapi.models[api].find();

      //strapi.models["article"].attributes

    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(articles);
  },
  getAnalyzer: async (ctx) => {
    const query = ctx.query;
    console.log("Before Query");
    const result = await analyzer('http://localhost:3000');
    console.log("After Query");
    ctx.send(result);
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
