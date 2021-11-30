
const { parseMultipartData, sanitizeEntity } = require('@strapi/utils')

module.exports = {
  /**
 * Retrieve records.
 *
 * @return {Array}
 */
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.plugins['cms-analyzer'].services.match.search(ctx.query);
    } else {
      entities = await strapi.plugins['cms-analyzer'].services.match.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].contentTypes.match }));
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.plugins['cms-analyzer'].services.match.findOne({ id });
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].contentTypes.match });
  },
  async count(ctx) {
    if (ctx.query._q) {
      return await strapi.plugins['cms-analyzer'].services.match.countSearch(ctx.query);
    }
    return await strapi.plugins['cms-analyzer'].services.match.count(ctx.query);
  },
  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = strapi.plugins['cms-analyzer'].services.match.create(data, { files });
    } else {
      entity = strapi.plugins['cms-analyzer'].services.match.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].contentTypes.match });
  },
  async update(ctx) {
    const { id } = ctx.params;

    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.plugins['cms-analyzer'].services.match.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.plugins['cms-analyzer'].services.match.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].contentTypes.match });
  },
  async delete(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.plugins['cms-analyzer'].services.match.delete({ id });
    return sanitizeEntity(entity, { model: strapi.plugins['cms-analyzer'].contentTypes.match });
  },
  async deleteAll(ctx) {
    const entity = await strapi.plugins['cms-analyzer'].services.match.deleteAll();
    return {"success": true};
  },
};
