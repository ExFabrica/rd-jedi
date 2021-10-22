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
        frontUrl: '',
        enabled: true,
        //setting3: 0,
        //setting4: { inner1: "" },
    }
    await pluginStore.set({ key: 'settings', value });
    return pluginStore.get({ key: 'settings' });
};
const createConfigFromData = async (data) => {
    //mapping
    const value = {
        frontUrl: data.frontUrl,
        enabled: data.enabled,
        /*setting3: data.setting3,
        setting4: { inner1: data.setting4.inner1 },*/
    }

    const pluginStore = getPluginStore();
    await pluginStore.set({ key: 'settings', value });
    return pluginStore.get({ key: 'settings' });
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
        return createConfigFromData(data);
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
                switch (value.type) {
                    case "text":
                    case "string":
                    case "richtext":
                    case "number":
                        item.attributes.push({ key, value, type: "text" });
                        break;
                    case "component":
                        const component = strapi.components[value.component];
                        for (const [keyC, valueC] of Object.entries(component.attributes)) {
                            if (valueC.type === "text" || valueC.type === "string" || valueC.type === "richtext" || valueC.type === "number")
                                item.attributes.push({ key: keyC, value: valueC, type: "component", componentName: key });
                        }
                        break;
                    case "enumeration":
                        for (const enu of value.enum)
                            item.attributes.push({ key: key, value: enu, type: "enumeration" });
                        break;
                    case "dynamiczone":
                        for (const componentName of value.components) {
                            const component = strapi.components[componentName];
                            for (const [keyC, valueC] of Object.entries(component.attributes)) {
                                if (valueC.type === "text" || valueC.type === "string" || valueC.type === "richtext" || valueC.type === "number")
                                    item.attributes.push({ key: keyC, value: valueC, type: "componentInZone", zone: key, componentName: componentName });
                            }
                        }
                        break;
                    default:
                        console.log("unknown", value);
                        break;
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
                            results = module.exports.getAttributeComparaison(results, page, documentByApiName.apiName, document, attribute, tag);
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
                    stringTags = _.concat(stringTags, tags.title);
                    const description = tags.meta.filter(item => item.name === "description");
                    if (description && description.length > 0)
                        stringTags = _.concat(stringTags, description[0]);
                    stringTags = _.concat(stringTags, tags.h1s);
                    stringTags = _.concat(stringTags, tags.h2s);
                    stringTags = _.concat(stringTags, tags.h3s);
                    stringTags = _.concat(stringTags, tags.h4s);
                    stringTags = _.concat(stringTags, tags.h5s);
                    stringTags = _.concat(stringTags, tags.h6s);
                    stringTags = _.concat(stringTags, tags.ps);
                }
                page.tags = stringTags;
                pages.push(page);
            }
        }
        return pages;
    },
    setFields: (page, document, apiName, tag, attributeKey, docfieldValue, text, results, componentName) => {
        if (docfieldValue && text) {
            let comparaison = false;
            if (text.length > 30)
                comparaison = docfieldValue.length > text.length ?
                    _.startsWith(docfieldValue.toLowerCase(), text.toLowerCase())
                    : _.startsWith(text.toLowerCase(), docfieldValue.toLowerCase());
            else
                comparaison = (docfieldValue.toLowerCase() === text.toLowerCase());

            //_.startsWith(docfieldValue.toLowerCase(), text.toLowerCase())
            //: _.startsWith(text.toLowerCase(), docfieldValue.toLowerCase());

            //docfieldValue.toLowerCase().includes(text.toLowerCase()) :
            //text.toLowerCase().includes(docfieldValue.toLowerCase());

            //if (docfieldValue.toLowerCase() === text.toLowerCase()) {
            if (comparaison) {
                const item = _.find(results, { frontUrl: page.url });
                if (!item)
                    results.push(
                        {
                            apiNames: [apiName],
                            frontUrl: page.url,
                            documentId: document.id,
                            documentFields: [{ fieldName: attributeKey, value: docfieldValue, apiName: apiName, tagName: tag.tag, componentName: componentName }],
                            seoAnalyse: page.seoAnalyse,
                            screenshot: page.screenshot
                        });
                else {
                    let field = componentName ?
                        _.find(item.documentFields, { fieldName: attributeKey, apiName: apiName, value: docfieldValue, tagName: tag.tag, componentName: componentName }) :
                        _.find(item.documentFields, { fieldName: attributeKey, apiName: apiName, value: docfieldValue, tagName: tag.tag });
                    if (!field) {
                        item.documentFields.push({ fieldName: attributeKey, value: docfieldValue, apiName: apiName, tagName: tag.tag, componentName: componentName });
                        if (!item.apiNames.includes(apiName))
                            item.apiNames.push(apiName);
                    }
                }
            }
        }
    },
    getAttributeComparaison: (results, page, apiName, document, attribute, tag) => {
        const attributeKey = attribute.key;
        let docfieldValue = "";
        const text = tag.tag === "meta" ? tag.content : tag.innerText;
        //console.log(`attributeKey -> ${attributeKey} *** DocfieldValue: ${docfieldValue} *** TEXT -> ${text} *** TAG -> ${tag.tag}`);
        switch (attribute.type) {
            case "enumeration":
            case "text":
                docfieldValue = document[attributeKey];
                if (docfieldValue)
                    module.exports.setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results);
                break;
            case "component":
                docfieldValue = document[attribute.componentName][attributeKey];
                if (docfieldValue)
                    module.exports.setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, attribute.componentName);
                break;
            case "componentInZone":
                const section = document[attribute.zone];
                if (_.isArray(section)) {
                    for (const componentChild of section) {
                        //TODO check that !
                        if (componentChild.features) {
                            for (const feature of componentChild.features) {
                                docfieldValue = feature[attributeKey];
                                if (docfieldValue)
                                    module.exports.setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, componentChild.__component);
                            }
                        }
                        else {
                            docfieldValue = componentChild[attributeKey];
                            if (docfieldValue)
                                module.exports.setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, componentChild.__component);
                        }
                    }
                }
                break;
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
        let fields = [];
        for (const result of results)
            fields = _.concat(fields, result.documentFields);
        fields = _.uniqBy(fields, v => [v.componentName, v.tagName, v.apiName, v.fieldName].join());

        for (const field of fields) {
            await matchesService.create({
                apiName: field.apiName,
                componentName: field.componentName,
                tagName: field.tagName,
                fieldName: field.fieldName,
            });
        }
    },
    clear: async () => {
        await analysesService.deleteAll();
        await matchesService.deleteAll();
    }
};
