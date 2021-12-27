'use strict';
const _ = require('lodash');

module.exports = ({ strapi }) => {
  const analyserService = strapi.plugins["cms-analyzer"].services.seoAnalyzer;
  const runConsolidation = async (ctx) => {
    // remove url property from context
    const { url } = ctx.query;
    delete ctx.query['url'];
    let result = {};
    try {
      return analyserService.runConsolidationProcess(url);
    }
    catch (err) {
      ctx.throw(500, err);
    }
  };
  const runRealTimeRulesAnalyze= async (ctx) => {
    const { body } = ctx.request;
    try {
      return analyserService.runRealTimeRulesAnalyze(body);
    }
    catch (err) {
      ctx.throw(500, err);
    }
  };
  return {
    runConsolidation,
    runRealTimeRulesAnalyze
  };
};
