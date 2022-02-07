'use strict';
const _ = require('lodash');

module.exports = ({ strapi }) => {
  const analyserService = strapi.plugins["cms-analyzer"].services.seoAnalyzer;
  const run = async (ctx) => {
    // remove url property from context
    const { body } = ctx.request;
    delete ctx.query['url'];
    try {
      return analyserService.run(body);
    }
    catch (err) {
      ctx.throw(500, err);
    }
  };
  const runRT= async (ctx) => {
    const { body } = ctx.request;
    try {
      return analyserService.runRT(body);
    }
    catch (err) {
      ctx.throw(500, err);
    }
  };
  return {
    run,
    runRT
  };
};
