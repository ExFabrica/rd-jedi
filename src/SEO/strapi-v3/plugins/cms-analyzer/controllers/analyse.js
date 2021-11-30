
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
 * Retrieve records.
 *
 * @return {Array}
 */

  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.plugins['cms-analyzer'].services.analyse.search(ctx.query);
    } else {
      entities = await strapi.plugins['cms-analyzer'].services.analyse.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.analyse }));
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.plugins['cms-analyzer'].services.analyse.findOne({ id });
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.analyse });
  },
  async findByDocumentId(ctx) {
    const { documentId } = ctx.params;

    const entity = await strapi.plugins['cms-analyzer'].services.analyse.findOne({ documentId });
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.analyse });
  },
  async count(ctx) {
    if (ctx.query._q) {
      return await strapi.plugins['cms-analyzer'].services.analyse.countSearch(ctx.query);
    }
    return await strapi.plugins['cms-analyzer'].services.analyse.count(ctx.query);
  },
  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = strapi.plugins['cms-analyzer'].services.analyse.create(data, { files });
    } else {
      entity = strapi.plugins['cms-analyzer'].services.analyse.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.analyse });
  },
  async update(ctx) {
    const { id } = ctx.params;

    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.plugins['cms-analyzer'].services.analyse.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.plugins['cms-analyzer'].services.analyse.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.analyse });
  },
  async delete(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.plugins['cms-analyzer'].services.analyse.delete({ id });
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.analyse });
  },
  async deleteAll(ctx) {
    const entity = await strapi.plugins['cms-analyzer'].services.analyse.deleteAll();
    return {"success": true};
  },
};
