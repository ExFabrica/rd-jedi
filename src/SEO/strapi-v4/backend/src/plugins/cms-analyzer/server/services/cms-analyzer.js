'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const _ = require('lodash');

module.exports = ({ strapi }) => {
    /**
     * cms-analyzer.js service
     *
     * @description: A set of functions similar to controller's actions to avoid code duplication.
     */
    const current = () => {
        return strapi.service('plugin::cms-analyzer.cmsAnalyzer');
    };
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
        }
        await pluginStore.set({ key: 'settings', value });
        return pluginStore.get({ key: 'settings' });
    };
    const createConfigFromData = async (data) => {
        //mapping
        const value = {
            frontUrl: data.frontUrl,
            enabled: data.enabled,
        }

        const pluginStore = getPluginStore();
        await pluginStore.set({ key: 'settings', value });
        return pluginStore.get({ key: 'settings' });
    };

    return {
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

        getComponentsToPopulate: async () => {
            let contentTypes = await current().getContentTypes();
            const components = [];

            for (const contentType of contentTypes) {
                components.push({ uid: contentType.uid, components: [], dynamicZones: [] });
                for (const [key, value] of Object.entries(contentType.attributes)) {
                    switch (value.type) {
                        case "component":
                            components.filter(item => item.uid === contentType.uid)[0].components.push(key);
                            break;
                        case "dynamiczone":
                            components.filter(item => item.uid === contentType.uid)[0].dynamicZones.push(key);
                            break;
                        default:
                            break;
                    }
                }
            }
            return components;
        },

        getPopulateObjectForUID: async (uid) => {
            const componentsToPopulate = await current().getComponentsToPopulate();
            let populate = {};
            const componentToPopulate = componentsToPopulate.filter(item => item.uid === uid);
            if (componentToPopulate && componentToPopulate.length > 0) {
                componentToPopulate[0].components?.forEach(component => {
                    populate[component] = { populate: true }
                });
                componentToPopulate[0].dynamicZones?.forEach(dynamicZone => {
                    populate[dynamicZone] = { populate: true }
                });
            }
            return populate;
        },

        getContents: async () => {
            let potentialFields = [];
            let contentTypes = await current().getContentTypes();

            for (const contentType of contentTypes) {
                let item = {
                    uid: contentType.uid,
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
                                    else if (valueC.type === "component") {
                                        console.log("valueC", valueC);
                                        const subComponent = strapi.components[valueC.component];
                                        for (const [keyD, valueD] of Object.entries(subComponent.attributes)) {
                                            if (valueD.type === "text" || valueD.type === "string" || valueD.type === "richtext" || valueD.type === "number")
                                                item.attributes.push({ key: keyD, value: valueD, type: "nestedComponentIncomponentInZone", zone: `${key}|${componentName}`, componentName: keyC });
                                        }
                                    }
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
            try {
                let results = [];
                await current().clear();

                // Get documents and attributes sorted by apiName
                const strapiDocumentsByContentType = await current().getStrapiDocumentsByContentType();
                console.log("strapiDocumentsByContentType", strapiDocumentsByContentType);
                // Get pages from analyzer
                const pages = await current().getAnalyzedPages(url);

                // Iterate on pages and documents to match data
                for (const page of pages) {
                    for (const tag of page.tags) {
                        for (const documentByContentType of strapiDocumentsByContentType) {
                            for (const document of documentByContentType.documents) {
                                for (const attribute of documentByContentType.contentType.attributes) {
                                    results = current().getAttributeComparaison(results, page, documentByContentType.contentType.uid, document, attribute, tag);
                                }
                            }
                        }
                    }
                }
                //Put founded data in plugin collection
                await current().pushResultsInCollection(results);
                //Work on result to extract relations ships between front tags and Strapi fields
                await current().pushMatchesInCollection(results);
            }
            catch (ex) {
                console.debug("Error", ex);
                return Promise.reject({ success: false, error: ex });
            }
            return Promise.resolve({ success: true })
        },

        getStrapiDocumentsByContentType: async () => {
            const contentTypes = await current().getContents();
            let documentsByContentType = [];

            for (const contentType of contentTypes) {
                const populate = await current().getPopulateObjectForUID(contentType.uid);
                const contentTypeDocuments = await strapi.query(contentType.uid).findMany({
                    populate: populate
                });
                if (contentTypeDocuments) {
                    documentsByContentType = _.concat(documentsByContentType,
                        {
                            contentType: contentType,
                            documents: _.isArray(contentTypeDocuments) ? contentTypeDocuments : [contentTypeDocuments],
                        });
                }
            }
            return documentsByContentType;
        },

        getAnalyzedPages: async (url) => {
            const rs = await analyzer.terminator([url], ['SEO']);
            let pages = [];
            for (const seo of rs.SEO) {
                let page = { uid: seo.result.uid, url: seo.pageInfo.url, tags: [], seoAnalyse: seo.result.results, screenshot: seo.pageInfo.screenshot };
                let stringTags = [];
                const tags = seo.result.tags;
                if (tags) {
                    stringTags = _.concat(stringTags, tags.title);
                    const description = tags.meta.filter(item => item.name === "description");
                    if (description && description.length > 0) {
                        description[0].tag = `${description[0].tag} (${description[0].name})`
                        stringTags = _.concat(stringTags, description[0]);
                    }
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
            return pages;
        },

        setFields: (page, document, uid, tag, attributeKey, docfieldValue, text, results, componentName, dynamicZoneName) => {
            if (docfieldValue && text) {
                let comparaison = false;
                if (text.length > 30)
                    comparaison = docfieldValue.length > text.length ?
                        _.startsWith(docfieldValue.toLowerCase(), text.toLowerCase())
                        : _.startsWith(text.toLowerCase(), docfieldValue.toLowerCase());
                else
                    comparaison = (docfieldValue.toLowerCase() === text.toLowerCase());

                if (comparaison) {
                    const item = _.find(results, { key: `${uid}_${page.url}` });
                    if (!item)
                        results.push(
                            {
                                key: `${uid}_${page.url}`,
                                apiName: uid,
                                frontUrl: page.url,
                                documentId: document.id,
                                documentFields: [{ fieldName: attributeKey, value: docfieldValue, apiName: uid, tagName: tag.tag, componentName: componentName, dynamicZoneName: dynamicZoneName }],
                                seoAnalyse: page.seoAnalyse,
                                screenshot: page.screenshot,
                                tags: page.tags
                            });
                    else {
                        let field = componentName ?
                            _.find(item.documentFields, { fieldName: attributeKey, apiName: uid, value: docfieldValue, tagName: tag.tag, componentName: componentName, dynamicZoneName: dynamicZoneName }) :
                            _.find(item.documentFields, { fieldName: attributeKey, apiName: uid, value: docfieldValue, tagName: tag.tag });
                        if (!field) {
                            item.documentFields.push({ fieldName: attributeKey, value: docfieldValue, apiName: uid, tagName: tag.tag, componentName: componentName, dynamicZoneName: dynamicZoneName });
                        }
                    }
                }
            }
        },

        getAttributeComparaison: (results, page, apiName, document, attribute, tag) => {
            const attributeKey = attribute.key;
            let docfieldValue = "";
            const text = tag.tag.includes("META") ? tag.content : tag.innerText;
            //console.log(`attributeKey -> ${attributeKey} *** DocfieldValue: ${docfieldValue} *** TEXT -> ${text} *** TAG -> ${tag.tag}`);
            switch (attribute.type) {
                case "enumeration":
                case "text":
                    docfieldValue = document[attributeKey];
                    if (docfieldValue)
                        current().setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results);
                    break;
                case "component":
                    docfieldValue = document[attribute.componentName] ? document[attribute.componentName][attributeKey] : null;
                    if (docfieldValue)
                        current().setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, attribute.componentName);
                    break;
                case "componentInZone":
                    const section = document[attribute.zone];
                    if (_.isArray(section)) {
                        for (const componentChild of section) {
                            docfieldValue = componentChild[attributeKey];
                            if (docfieldValue)
                                current().setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, componentChild.__component, attribute.zone);
                        }
                    }
                    break;
                case "nestedComponentIncomponentInZone":
                    const componentsName = attribute.zone.split("|");
                    const zone = componentsName[0];
                    const nestedCompoent = componentsName[1];
                    const nestedInnerComponents = document[zone].filter(item => item.__component === nestedCompoent);
                    if (nestedInnerComponents && nestedInnerComponents.length > 0) {
                        if (_.isArray(nestedInnerComponents[0][attribute.componentName])) {
                            nestedInnerComponents[0][attribute.componentName].forEach(element => {
                                docfieldValue = element[attributeKey];
                                if (docfieldValue)
                                    current().setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, attribute.componentName, attribute.zone);
                            });
                        }
                        else {
                            docfieldValue = nestedInnerComponents[0][attribute.componentName][attributeKey];
                            if (docfieldValue)
                                current().setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, attribute.componentName, attribute.zone);
                        }
                    }
                    break;
                default:
                    break;
            }
            return results;
        },

        pushResultsInCollection: async (results) => {
            for (const result of results) {
                await strapi.service('plugin::cms-analyzer.analyse').create({
                    key: result.key,
                    apiName: result.apiName,
                    frontUrl: result.frontUrl,
                    documentId: result.documentId,
                    seoAnalyse: JSON.stringify(result.seoAnalyse ? result.seoAnalyse : {}),
                    documentFields: JSON.stringify(result.documentFields ? result.documentFields : {}),
                    screenshot: result.screenshot,
                    tags: JSON.stringify(result.tags ? result.tags : {}),
                });
            }
        },

        pushMatchesInCollection: async (results) => {
            let fields = [];
            for (const result of results)
                fields = _.concat(fields, result.documentFields);
            fields = _.uniqBy(fields, v => [v.componentName, v.tagName, v.apiName, v.fieldName].join());

            for (const field of fields) {
                await strapi.service('plugin::cms-analyzer.match').create({
                    apiName: field.apiName,
                    componentName: field.componentName,
                    tagName: field.tagName,
                    fieldName: field.fieldName,
                    dynamicZoneName: field.dynamicZoneName
                });
            }
        },

        clear: async () => {
            await strapi.service('plugin::cms-analyzer.analyse').deleteAll();
            await strapi.service('plugin::cms-analyzer.match').deleteAll();
        },

        runRealTimeRulesAnalyze: async (payload) => {
            return analyzer.runSEORealTimeRulesAnalyse(payload);
        }
    };
};
