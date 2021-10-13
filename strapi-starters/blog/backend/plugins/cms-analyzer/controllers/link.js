
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
      entities = await strapi.plugins['cms-analyzer'].services.link.search(ctx.query);
    } else {
      entities = await strapi.plugins['cms-analyzer'].services.link.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.link }));
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.plugins['cms-analyzer'].services.link.findOne({ id });
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.link });
  },
  async count(ctx) {
    if (ctx.query._q) {
      return await strapi.plugins['cms-analyzer'].services.link.countSearch(ctx.query);
    }
    return await strapi.plugins['cms-analyzer'].services.link.count(ctx.query);
  },
  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = strapi.plugins['cms-analyzer'].services.link.create(data, { files });
    } else {
      entity = strapi.plugins['cms-analyzer'].services.link.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.link });
  },
  async update(ctx) {
    const { id } = ctx.params;

    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.plugins['cms-analyzer'].services.link.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.plugins['cms-analyzer'].services.link.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.link });
  },
  async delete(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.plugins['cms-analyzer'].services.link.delete({ id });
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].models.link });
  },
  async deleteAll(ctx) {
    const entity = await strapi.plugins['cms-analyzer'].services.link.deleteAll();
    return {"success": true};
  },
};
