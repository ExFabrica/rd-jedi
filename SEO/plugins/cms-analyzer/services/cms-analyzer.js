'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const analysesService = require('./analyse');
const matchesService = require('./match');
const _ = require('lodash');
/**
 * cms-analyzer.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */
const getPluginStore = () => {
    return strapi.store({
        environment: '',
        type: 'plugin',
        name: 'cms-analyzer',
    });
};
const createDefaultConfig = async () => {
    const pluginStore = getPluginStore();
    const value = {
        setting1: '',
        setting2: true,
        setting3: 0,
        setting4: { inner1: "" },
    }
    await pluginStore.set({ key: 'settings', value });
    return await pluginStore.get({ key: 'settings' });
};
const createConfigFromData = async (data) => {
    //mapping
    const value = {
        setting1: data.setting1,
        setting2: data.setting2,
        setting3: data.setting3,
        setting4: { inner1: data.setting4.inner1 },
    }

    const pluginStore = getPluginStore();
    await pluginStore.set({ key: 'settings', value });
    return await pluginStore.get({ key: 'settings' });
};

module.exports = {
    //SETTINGS
    getSettings: async () => {
        const pluginStore = getPluginStore();
        let config = await pluginStore.get({ key: 'settings' });
        if (!config) {
            config = await createDefaultConfig();
        }
        return config;
    },
    setSettings: async (data) => {
        return await createConfigFromData(data);
    },
    //CONTENT-TYPES
    getContentTypes: async () => {
        let contentTypes = [];
        Object.values(strapi.contentTypes).map(contentType => {
            if ((contentType.kind === "collectionType" || contentType.kind === "singleType") && !contentType.plugin) {
                contentTypes.push(contentType);
            }
        });
        return contentTypes;
    },
    getContents: async () => {
        let potentialFields = [];
        let contentTypes = await module.exports.getContentTypes();

        for (const contentType of contentTypes) {
            let item = {
                apiName: contentType.apiName,
                kind: contentType.kind,
                attributes: []
            }
            for (const [key, value] of Object.entries(contentType.attributes)) {
                if (value.type === "text" || value.type === "string")
                    item.attributes.push({ key, value });
                if (value.type === "component") {
                    const component = strapi.components[value.component];
                    for (const [keyC, valueC] of Object.entries(component.attributes)) {
                        if (valueC.type === "text" || valueC.type === "string")
                            item.attributes.push({ key: key + '.' + keyC, value: valueC });
                    }
                }
            }
            potentialFields.push(item);
        }
        return potentialFields.filter(content => content.attributes.length > 0);
    },
    runConsolidationProcess: async (url) => {
        let results = [];
        await module.exports.clear();
        // Get documents and attributes sorted by apiName
        const strapiDocumentsByApiName = await module.exports.getStrapiDocumentsByApiName();
        // Get pages from analyzer
        const pages = await module.exports.getAnalyzedPages(url);
        // Iterate on pages and documents to match data
        for (const page of pages) {
            for (const tag of page.tags) {
                for (const documentByApiName of strapiDocumentsByApiName) {
                    for (const document of documentByApiName.documents) {
                        for (const attribute of documentByApiName.attributes) {
                            results = module.exports.getAttributeComparaison(results, page, documentByApiName.apiName, document, attribute.key, tag);
                        }
                    }
                }
            }
        }
        //Put founded data in plugin collection
        await module.exports.pushResultsInCollection(results);
        //Work on result to extract relations ships between front tags and Strapi fields
        await module.exports.pushMatchesInCollection(results);
    },
    getStrapiDocumentsByApiName: async () => {
        const contents = await module.exports.getContents();
        let documentsByApiName = [];
        for (const content of contents) {
            const contentDocuments = await strapi.services[content.apiName].find();
            if (contentDocuments)
                documentsByApiName = _.concat(documentsByApiName,
                    {
                        apiName: content.apiName,
                        documents: _.isArray(contentDocuments) ? contentDocuments : [contentDocuments],
                        attributes: content.attributes
                    });
        }
        return documentsByApiName;
    },
    getAnalyzedPages: async (url) => {
        const rs = await analyzer(url);
        let pages = [];
        for (const fetchedData of rs.sitemap) {
            const foundPages = rs.results.filter(item => item.url === fetchedData.url);
            if (foundPages && foundPages.length > 0) {
                let page = { uid: foundPages[0].uid, url: fetchedData.url, tags: [], seoAnalyse: foundPages[0].results, screenshot: fetchedData.screenshot };
                let stringTags = [];
                const tags = foundPages[0].tags;
                if (tags) {
                    const description = tags.meta.filter(item => item.name === "description");
                    stringTags = _.concat(stringTags, tags.title);
                    if (description && description.length > 0)
                        stringTags = _.concat(stringTags, description[0]);
                    stringTags = _.concat(stringTags, tags.h1s);
                    stringTags = _.concat(stringTags, tags.h2s);
                    stringTags = _.concat(stringTags, tags.h3s);
                    stringTags = _.concat(stringTags, tags.h4s);
                    stringTags = _.concat(stringTags, tags.h5s);
                    stringTags = _.concat(stringTags, tags.h6s);
                    //stringTags = _.concat(stringTags, tags.ps);
                }
                page.tags = stringTags;
                pages.push(page);
            }
        }
        return pages;
    },
    getAttributeComparaison: (results, page, apiName, document, attributeKey, tag) => {
        let attributeValue = document[attributeKey];
        if (attributeKey.indexOf('.') > -1) {
            const splitedKeyName = attributeKey.split('.');
            attributeValue = document[splitedKeyName[0]][splitedKeyName[1]];
        }
        const text = tag.tag === "meta" ? tag.content : tag.innerText;

        if (attributeValue && text) {
            let comparaison = attributeValue.length > text.length ?
                attributeValue.toLowerCase().includes(text.toLowerCase()) :
                text.toLowerCase().includes(attributeValue.toLowerCase());

            //_.startsWith(attributeValue.toLowerCase(), text.toLowerCase())
            //: _.startsWith(text.toLowerCase(), attributeValue.toLowerCase());

            if (comparaison) {
                const item = _.find(results, { frontUrl: page.url });
                if (!item)
                    results.push(
                        {
                            apiNames: [apiName],
                            frontUrl: page.url,
                            documentId: document.id,
                            documentFields: [{ key: attributeKey, value: attributeValue, from: apiName, tag: tag.tag }],
                            seoAnalyse: page.seoAnalyse,
                            screenshot: page.screenshot
                        });
                else {
                    let field = _.find(item.documentFields, { key: attributeKey, from: apiName });
                    if (!field) {
                        item.documentFields.push({ key: attributeKey, value: attributeValue, from: apiName, tag: tag.tag });
                        if (!item.apiNames.includes(apiName))
                            item.apiNames.push(apiName);
                    }
                }
            }
        }
        return results;
    },
    pushResultsInCollection: async (results) => {
        for (const result of results) {
            await analysesService.create({
                apiNames: JSON.stringify(result.apiNames ? result.apiNames : {}),
                frontUrl: result.frontUrl,
                documentId: result.documentId,
                seoAnalyse: JSON.stringify(result.seoAnalyse ? result.seoAnalyse : {}),
                documentFields: JSON.stringify(result.documentFields ? result.documentFields : {}),
                screenshot: result.screenshot
            });
        }
    },
    pushMatchesInCollection: async (results) => {
        let fieldResults = {};
        let fields = [];
        for (const result of results) {
            fields = _.concat(fields, result.documentFields);
            fields = _.uniq(fields);
            fieldResults = fields.reduce((acc, curVal) => {
                if (!acc.hasOwnProperty(curVal.from))
                    acc[curVal.from] = {};
                if (!acc[curVal.from].hasOwnProperty(curVal.key))
                    acc[curVal.from][curVal.key] = curVal.tag;
                return acc;
            }, {});
        }

        for (const property in fieldResults) {
            for (const innerProperty in fieldResults[property]) {
                await matchesService.create({
                    apiName: property,
                    tag: fieldResults[property][innerProperty],
                    field: innerProperty,
                });
            }
        }
    },
    clear: async () => {
        await analysesService.deleteAll();
        await matchesService.deleteAll();
    }
};
