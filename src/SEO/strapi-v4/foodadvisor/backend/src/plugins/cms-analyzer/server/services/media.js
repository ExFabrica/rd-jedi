'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const _ = require('lodash');

module.exports = ({ strapi }) => {
    const runConsolidation = async (url) => {
        const rs = await analyzer.terminator([url], ['Images']);
        for (const data of rs.Images) {
            console.log("image", data.result.images);
        }
    }
    return {
        runConsolidation
    }
}
