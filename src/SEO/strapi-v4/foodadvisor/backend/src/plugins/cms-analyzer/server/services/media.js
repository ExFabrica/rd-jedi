'use strict';
const _ = require('lodash');

module.exports = ({ strapi }) => {
    const query = strapi.query('plugin::cms-analyzer.media');
    const analyseContentType = strapi.plugins['cms-analyzer'].contentTypes.media;
    const findMany = async (params, populate) => {
        return query.findMany(params, populate);
    };
    const findOne = async (params, populate) => {
        return query.findOne(params, populate);
    };
    const count = async (params) => {
        return query.count(params);
    }
    const create = async (data, { files } = {}) => {
        const validData = await strapi.entityValidator.validateEntityCreation(
            analyseContentType,
            data,
            { isDraft: isDraft(data, analyseContentType) }
        );

        const entry = await query.create({ data: validData });

        if (files) {
            // automatically uploads the files based on the entry and the model
            await strapi.entityService.uploadFiles(entry, files, {
                model: 'media',
                // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
            });
            return this.findOne({ id: entry.id });
        }

        return entry;
    };
    const update = async (params, data, { files } = {}) => {
        const existingEntry = await query.findOne(params);

        const validData = await strapi.entityValidator.validateEntityUpdate(
            analyseContentType,
            data,
            { isDraft: isDraft(existingEntry, analyseContentType) }
        );

        const entry = await query.update(params, { data: validData });
        if (files) {
            // automatically uploads the files based on the entry and the model
            await strapi.entityService.uploadFiles(entry, files, {
                model: 'media',
                // if you are using a plugin's model you will have to add the `source` key (source: 'users-permissions')
            });
            return this.findOne({ id: entry.id });
        }

        return entry;
    };
    const deleteAll = async () => {
        return query.deleteMany(
            {
                where: {
                    id: {
                        $gt: 0,
                    },
                }
            }
        );
    };
    const search = async (params) => {
        return query.search(params);
    };
    const countSearch = async (params) => {
        return await query.countSearch(params);
    };
    return {
        findMany,
        findOne,
        count,
        create,
        update,
        async delete(params) {
            return await query.delete(params);
        },
        deleteAll,
        search,
        countSearch
    };
}
