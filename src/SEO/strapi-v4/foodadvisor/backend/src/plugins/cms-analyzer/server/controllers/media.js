'use strict';

module.exports = ({ strapi }) => {
    const mediasService = strapi.plugins["cms-analyzer"].services.media;
    const runConsolidation = async (ctx) => {
        // remove url property from context
        const { url } = ctx.query;
        delete ctx.query['url'];
        try {
          mediasService.runConsolidation(url);
        }
        catch (err) {
          ctx.throw(500, err);
        }
      };
    return { runConsolidation };
};
