'use strict';
const { parseMultipartData, sanitizeEntity } = require('@strapi/utils');

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("plugin::cms-analyzer.media", ({ strapi }) => {
    const findMany = () => {
        console.log("polop");
    }
    return { findMany };
});
