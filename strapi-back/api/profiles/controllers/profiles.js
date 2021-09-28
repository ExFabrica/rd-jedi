'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  async findMe(ctx) {
    let entity;
    const user = ctx.state.user;

    if (!user)
      return ctx.badRequest(null, [{ messages: [{ id: 'No Authorization header found' }] }]);

    entity = await strapi.services.profiles.findOne({ user: user.id });

    return sanitizeEntity(entity, { model: strapi.models.profiles });
  },
  async createMe(ctx) {
    let entity;
    const user = ctx.state.user;
    if (!user)
      return ctx.badRequest(null, [{ messages: [{ id: 'No Authorization header found' }] }]);

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      data['user'] = user;
      entity = await strapi.services.profiles.create(data, { files });
    } else {
      const data = ctx.request.body;
      data['user'] = user;
      entity = await strapi.services.profiles.create(data);
    }
    return sanitizeEntity(entity, { model: strapi.models.profiles });
  },
  async updateMe(ctx) {
    const user = ctx.state.user;
    if (!user)
      return ctx.badRequest(null, [{ messages: [{ id: 'No Authorization header found' }] }]);
    let entity;
    const entitiyToUpdate = await strapi.services.profiles.findOne({ user: user.id });
    if (entitiyToUpdate) {
      if (ctx.is('multipart')) {
        const { data, files } = parseMultipartData(ctx);
        data['user'] = user;
        entity = await strapi.services.profiles.update({ id: entitiyToUpdate.id }, data, {
          files,
        });
      } else {
        const data = ctx.request.body;
        data['user'] = user;
        entity = await strapi.services.profiles.update({ id: entitiyToUpdate.id }, data);
      }
    }
    return sanitizeEntity(entity, { model: strapi.models.profiles });
  },
  async deleteMe(ctx) {
    const user = ctx.state.user;
    if (!user)
      return ctx.badRequest(null, [{ messages: [{ id: 'No Authorization header found' }] }]);
    const entitiyToUpdate = await strapi.services.profiles.findOne({ user: user.id });
    if (entitiyToUpdate) {
      const { id } = ctx.params;
      const entity = await strapi.services.profiles.delete({ id: entitiyToUpdate.id });
      return sanitizeEntity(entity, { model: strapi.models.profiles });
    }
  }
};
