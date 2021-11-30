
'use strict';
const { isDraft } = require('@strapi/utils').contentTypes;

module.exports = ({ strapi }) => {
    return {
        find(params, populate) {
            return strapi.query('plugin::cms-analyzer.analyse').findMany(params, populate);
        },

        findOne(params, populate) {
            return strapi.query('plugin::cms-analyzer.analyse').findOne(params, populate);
        },

        count(params) {
            return strapi.query('plugin::cms-analyzer.analyse').count(params);
        },

        async create(data, { files } = {}) {
            const validData = await strapi.entityValidator.validateEntityCreation(
                strapi.plugins['cms-analyzer'].contentTypes.analyse,
                data,
                { isDraft: isDraft(data, strapi.plugins['cms-analyzer'].contentTypes.analyse) }
            );

            const entry = await strapi.query('plugin::cms-analyzer.analyse').create({ data: validData });

            if (files) {
                // automatically uploads the files based on the entry and the model
                await strapi.entityService.uploadFiles(entry, files, {
                    model: 'analyses',
                    // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
                });
                return this.findOne({ id: entry.id });
            }

            return entry;
        },

        async update(params, data, { files } = {}) {
            const existingEntry = await strapi.query('plugin::cms-analyzer.analyse').findOne(params);

            const validData = await strapi.entityValidator.validateEntityUpdate(
                strapi.plugins['cms-analyzer'].contentTypes.analyse,
                data,
                { isDraft: isDraft(existingEntry, strapi.plugins['cms-analyzer'].contentTypes.analyse) }
            );

            const entry = await query('plugin::cms-analyzer.analyse').update(params,{ data: validData });

            if (files) {
                // automatically uploads the files based on the entry and the model
                await strapi.entityService.uploadFiles(entry, files, {
                    model: 'analyses',
                    // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
                });
                return this.findOne({ id: entry.id });
            }

            return entry;
        },

        async delete(params) {
            return await strapi.query('plugin::cms-analyzer.analyse').delete(params);
        },

        async deleteAll() {
            return await strapi.query('plugin::cms-analyzer.analyse').delete({ where: { id: { $gt: 0 } } });
        },

        async search(params) {
            return await strapi.query('plugin::cms-analyzer.analyse').search(params);
        },

        async countSearch(params) {
            return await strapi.query('plugin::cms-analyzer.analyse').countSearch(params);
        }
    };
};
