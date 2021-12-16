'use strict';
const _ = require('lodash');

module.exports = ({ strapi }) => {
  const analyserService = strapi.plugins["cms-analyzer"].services.cmsAnalyzer;

  const getContentTypes = async (ctx) => {
    let contentTypes = {};
    try {
      contentTypes = await analyserService.getContentTypes();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(contentTypes);
  };

  const getContents = async (ctx) => {
    let contents = {};
    try {
      contents = await analyserService.getContents();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(contents);
  };

  const getDocuments = async (ctx) => {
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
  }

  const runConsolidation = async (ctx) => {
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
  };

  const runRealTimeRulesAnalyze= async (ctx) => {
    let result;
    // remove url property from context
    const { body } = ctx.request;
    try {
      result = await analyserService.runRealTimeRulesAnalyze(body);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(result);
  };

  const getSettings = async (ctx) => {
    let config = {};
    try {
      config = await analyserService.getSettings();
      ctx.send(config);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
  }

  const setSettings = async (ctx)  => {
    let config = {};
    const { body } = ctx.request;
    try {
      await analyserService.setSettings(body);
      config = await this.getSettings();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(config);
  }

  return {
    getContentTypes,
    getContents,
    getDocuments,
    runConsolidation,
    runRealTimeRulesAnalyze,
    //TODO -> create a new service settings.
    getSettings,
    setSettings
  }
};
