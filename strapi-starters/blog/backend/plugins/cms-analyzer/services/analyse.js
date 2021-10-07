
const { isDraft } = require('strapi-utils').contentTypes;

module.exports = {
    find(params, populate) {
        return strapi.query('analyse', 'cms-analyzer').find(params, populate);
    },
    findOne(params, populate) {
        return strapi.query('analyse', 'cms-analyzer').findOne(params, populate);
    },
    count(params) {
        return strapi.query('analyse', 'cms-analyzer').count(params);
    },
    async create(data, { files } = {}) {
        const validData = await strapi.entityValidator.validateEntityCreation(
            strapi.plugins['cms-analyzer'].models.analyse,
            data,
            { isDraft: isDraft(data, strapi.plugins['cms-analyzer'].models.analyse) }
        );

        const entry = await strapi.query('analyse', 'cms-analyzer').create(validData);

        if (files) {
            // automatically uploads the files based on the entry and the model
            await strapi.entityService.uploadFiles(entry, files, {
                model: 'analyse',
                // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
            });
            return this.findOne({ id: entry.id });
        }

        return entry;
    },
    async update(params, data, { files } = {}) {
        const existingEntry = await strapi.query('analyse', 'cms-analyzer').findOne(params);

        const validData = await strapi.entityValidator.validateEntityUpdate(
            strapi.plugins['cms-analyzer'].models.analyse,
            data,
            { isDraft: isDraft(existingEntry, strapi.plugins['cms-analyzer'].models.analyse) }
        );

        const entry = await query('analyse', 'cms-analyzer').update(params, validData);

        if (files) {
            // automatically uploads the files based on the entry and the model
            await strapi.entityService.uploadFiles(entry, files, {
                model: 'analyse',
                // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
            });
            return this.findOne({ id: entry.id });
        }

        return entry;
    },
    async delete(params) {
        return await strapi.query('analyse', 'cms-analyzer').delete(params);
    },
    async deleteAll() {
        return await strapi.query('analyse', 'cms-analyzer').delete({id_gt: 0});
    },
    async search(params) {
        return await strapi.query('analyse', 'cms-analyzer').search(params);
    },
    async countSearch(params) {
        return await strapi.query('analyse', 'cms-analyzer').countSearch(params);
    },
};
