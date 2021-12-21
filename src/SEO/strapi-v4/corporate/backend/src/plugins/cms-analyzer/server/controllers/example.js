'use strict';
const { parseMultipartData, sanitizeEntity } = require('@strapi/utils');

module.exports = ({ strapi }) => {
    const exampleService = strapi.plugins["cms-analyzer"].services.example;
    const findMany = async (ctx) => {
        try {
            ctx.send(await exampleService.findMany());
        }
        catch (err) { cxt.send({ error: err }); }
    };
    return {
        findMany
    }
}