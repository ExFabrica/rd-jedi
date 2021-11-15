'use strict';
const { isDraft } = require('@strapi/utils').contentTypes;

module.exports = ({ strapi }) => {
    return {
        find(params, populate) {
            return strapi.query('plugin::cms-analyzer.match').findMany(params, populate);
        },

        findOne(params, populate) {
            return strapi.query('plugin::cms-analyzer.match').findOne(params, populate);
        },

        count(params) {
            return strapi.query('plugin::cms-analyzer.match').count(params);
        },

        async create(data, { files } = {}) {
            const validData = await strapi.entityValidator.validateEntityCreation(
                strapi.plugins['cms-analyzer'].contentTypes.match,
                data,
                { isDraft: isDraft(data, strapi.plugins['cms-analyzer'].contentTypes.match) }
            );

            const entry = await strapi.query('plugin::cms-analyzer.match').create(validData);

            if (files) {
                // automatically uploads the files based on the entry and the model
                await strapi.entityService.uploadFiles(entry, files, {
                    model: 'match',
                    // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
                });
                return this.findOne({ id: entry.id });
            }

            return entry;
        },

        async update(params, data, { files } = {}) {
            const existingEntry = await strapi.query('plugin::cms-analyzer.match').findOne(params);

            const validData = await strapi.entityValidator.validateEntityUpdate(
                strapi.plugins['cms-analyzer'].contentTypes.match,
                data,
                { isDraft: isDraft(existingEntry, strapi.plugins['cms-analyzer'].contentTypes.match) }
            );

            const entry = await query('plugin::cms-analyzer.match').update(params, validData);

            if (files) {
                // automatically uploads the files based on the entry and the model
                await strapi.entityService.uploadFiles(entry, files, {
                    model: 'match',
                    // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
                });
                return this.findOne({ id: entry.id });
            }

            return entry;
        },

        async delete(params) {
            return await strapi.query('plugin::cms-analyzer.match').delete(params);
        },

        async deleteAll() {
            return await strapi.query('plugin::cms-analyzer.match').delete({id_gt: 0});
        },

        async search(params) {
            return await strapi.query('plugin::cms-analyzer.match').search(params);
        },

        async countSearch(params) {
            return await strapi.query('plugin::cms-analyzer.match').countSearch(params);
        }
    };
};
