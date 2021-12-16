'use strict';
const _ = require('lodash');

module.exports = ({ strapi }) => {
  const analyserService = strapi.plugins["cms-analyzer"].services.cmsAnalyzer;
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
    const { body } = ctx.request;
    try {
      result = await analyserService.runRealTimeRulesAnalyze(body);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(result);
  };
  return {
    runConsolidation,
    runRealTimeRulesAnalyze
  };
};
