'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const _ = require('lodash');

module.exports = ({ strapi }) => {
    const analyseService = () => strapi.plugins["cms-analyzer"].services.analyse;
    const matchService = () => strapi.plugins["cms-analyzer"].services.match;
    const getContentTypes = async () => {
        let contentTypes = [];
        Object.values(strapi.contentTypes).map(contentType => {
            if ((contentType.kind === "collectionType" || contentType.kind === "singleType") && !contentType.plugin) {
                contentTypes.push(contentType);
            }
        });
        return contentTypes;
    };
    const getComponentsToPopulate = async () => {
        let contentTypes = await getContentTypes();
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
    };
    const getPopulateObjectForUID = async (uid) => {
        const componentsToPopulate = await getComponentsToPopulate();
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
    };
    const getStructure = (item, contentType, type, componentName, zoneName, parentComponentName) => {
        for (const [attributeKey, attributeValue] of Object.entries(contentType.attributes)) {
            switch (attributeValue.type) {
                case "text":
                case "string":
                case "richtext":
                case "number":
                    switch (type) {
                        case "component":
                            item.attributes.push({ key: attributeKey, value: attributeValue, type: "text", container: "component", componentName: componentName });
                            break;
                        case "componentInZone":
                            item.attributes.push({ key: attributeKey, value: attributeValue, type: "text", container: "componentInZone", zone: zoneName, componentName: componentName });
                            break;
                        case "nestedComponentInComponentInZone":
                            item.attributes.push({ key: attributeKey, value: attributeValue, type: "text", container: "nestedComponentInComponentInZone", zone: `${zoneName}|${parentComponentName}`, componentName: componentName });
                            break;
                        case "default":
                            item.attributes.push({ key: attributeKey, value: attributeValue, type: "text", container: "default" });
                            break;
                    }
                case "component":
                    switch (type) {
                        case "default":
                            const component = strapi.components[attributeValue.component];
                            if (component)
                                getStructure(item, component, "component", attributeKey);
                            break;
                        case "componentInZone":
                            const zoneComponentInZone = strapi.components[attributeValue.component];
                            if (zoneComponentInZone)
                                getStructure(item, zoneComponentInZone, "nestedComponentInComponentInZone", attributeKey, zoneName, componentName);
                            break;
                    }
                    break;
                case "enumeration":
                    switch (type) {
                        case "component":
                            for (const enu of attributeValue.enum)
                                item.attributes.push({ key: attributeKey, value: enu, type: "enumeration", container: "component", componentName: componentName });
                            break;
                        case "componentInZone":
                            for (const enu of attributeValue.enum)
                                item.attributes.push({ key: attributeKey, value: enu, type: "enumeration", container: "componentInZone", zone: zoneName, componentName: componentName });
                            break;
                        case "nestedComponentInComponentInZone":
                            for (const enu of attributeValue.enum)
                                item.attributes.push({ key: attributeKey, value: enu, type: "enumeration", container: "nestedComponentInComponentInZone", zone: `${zoneName}|${parentComponentName}`, componentName: componentName });
                            break;
                        case "default":
                            for (const enu of attributeValue.enum)
                                item.attributes.push({ key: attributeKey, value: enu, type: "enumeration", container: "default" });
                            break;
                    }
                    break;
                case "dynamiczone":
                    if (type === "default") {
                        for (const componentName of attributeValue.components) {
                            const component = strapi.components[componentName];
                            getStructure(item, component, "componentInZone", componentName, attributeKey);
                        }
                    }
                    break;
                case "media":
                    switch (type) {
                        case "component":
                            item.medias.push({ key: attributeKey, value: attributeValue, container: "component", componentName: componentName });
                            break;
                        case "componentInZone":
                            item.medias.push({ key: attributeKey, value: attributeValue, container: "componentInZone", zone: zoneName, componentName: componentName });
                            break;
                        case "nestedComponentInComponentInZone":
                            item.medias.push({ key: attributeKey, value: attributeValue, container: "nestedComponentInComponentInZone", zone: `${zoneName}|${parentComponentName}`, componentName: componentName });
                            break;
                        case "default":
                            item.medias.push({ key: attributeKey, value: attributeValue, container: "default" });
                            break;
                    }
                    break;
                default:
                    //console.log("unknown", value);
                    break;
            }
        }
    }
    const getContents = async () => {
        let potentialFields = [];
        let contentTypes = await getContentTypes();

        for (const contentType of contentTypes) {
            let item = {
                uid: contentType.uid,
                kind: contentType.kind,
                attributes: [],
                medias: []
            }
            getStructure(item, contentType, "default");
            potentialFields.push(item);
        }
        return potentialFields.filter(content => content.attributes.length > 0);
    };
    const runConsolidationProcess = async (url) => {
        try {
            let results = [];
            await clear();

            // Get pages from analyzer
            const pages = await getAnalyzedPages(url);

            /************ FIRST PASS: Single Type *****************/
            // Get documents and attributes sorted by apiName
            const strapiDocumentsByContentType = await getStrapiDocumentsByContentType();
            const strapiSingleDocumentsByContentType = strapiDocumentsByContentType.filter(item => item.contentType.kind == "singleType");
            const strapiCollectionDocumentsByContentType = strapiDocumentsByContentType.filter(item => item.contentType.kind == "collectionType");
            // Iterate on pages and documents to match data
            for (const page of pages) {
                for (const tag of page.tags) {
                    for (const documentByContentType of strapiSingleDocumentsByContentType) {
                        for (const document of documentByContentType.documents) {
                            for (const attribute of documentByContentType.contentType.attributes) {
                                results = getAttributeComparaison(results, page, documentByContentType.contentType.uid, document, attribute, tag);
                            }
                        }
                    }
                }
            }
            results = filterResultsByFieldsCount(results);
            //Put founded data in plugin collection
            await pushResultsInCollection(results);
            //Work on result to extract relations ships between front tags and Strapi fields
            await pushMatchesInCollection(results);

            /************ SECOND PASS: Collection Type *****************/
            results = [];
            const analyses = await analyseService().findMany();
            const groupedMatchesByApiName = _.groupBy(analyses, "frontUrl");
            _.remove(pages, (item) => {
                return Object.keys(groupedMatchesByApiName).includes(item.url);
            });
            for (const page of pages) {
                for (const tag of page.tags) {
                    for (const documentByContentType of strapiCollectionDocumentsByContentType) {
                        for (const document of documentByContentType.documents) {
                            for (const attribute of documentByContentType.contentType.attributes) {
                                results = getAttributeComparaison(results, page, documentByContentType.contentType.uid, document, attribute, tag);
                            }
                        }
                    }
                }
            }
            results = filterResultsByFieldsCount(results);
            //Put founded data in plugin collection
            await pushResultsInCollection(results);
            //Work on result to extract relations ships between front tags and Strapi fields
            await pushMatchesInCollection(results);
        }
        catch (ex) {
            console.debug("Error", ex);
            return Promise.reject({ success: false, error: ex });
        }
        return Promise.resolve({ success: true })
    };
    const getStrapiDocumentsByContentType = async () => {
        const contentTypes = await getContents();
        let documentsByContentType = [];

        for (const contentType of contentTypes) {
            const populate = await getPopulateObjectForUID(contentType.uid);
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
    };
    const getAnalyzedPages = async (url) => {
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
    }
    const setFields = (page, document, uid, tag, attributeKey, docfieldValue, text, results, componentName, dynamicZoneName) => {
        if (docfieldValue && text) {
            if (docfieldValue.toLowerCase() === text.toLowerCase()) {
                const item = _.find(results, { key: `${uid}_${page.url}` });
                if (!item)
                    results.push(
                        {
                            key: `${uid}_${page.url}`,
                            apiName: uid,
                            frontUrl: page.url,
                            documentId: document.id,
                            documentFields: [{ fieldName: attributeKey, value: docfieldValue, apiName: uid, tagName: tag.tag, componentName: componentName, dynamicZoneName: dynamicZoneName, status: "active" }],
                            seoAnalyse: page.seoAnalyse,
                            screenshot: page.screenshot,
                            tags: page.tags
                        });
                else {
                    let field = componentName ?
                        _.find(item.documentFields, { fieldName: attributeKey, apiName: uid, value: docfieldValue, tagName: tag.tag, componentName: componentName, dynamicZoneName: dynamicZoneName, status: "active" }) :
                        _.find(item.documentFields, { fieldName: attributeKey, apiName: uid, value: docfieldValue, tagName: tag.tag, status: "active" });
                    if (!field) {
                        item.documentFields.push({ fieldName: attributeKey, value: docfieldValue, apiName: uid, tagName: tag.tag, componentName: componentName, dynamicZoneName: dynamicZoneName, status: "active" });
                    }
                }
            }
        }
    };
    const getAttributeComparaison = (results, page, apiName, document, attribute, tag) => {
        const attributeKey = attribute.key;
        let docfieldValue = "";
        const text = tag.tag.includes("META") ? tag.content : tag.innerText;
        switch (attribute.container) {
            case "default":
                docfieldValue = document[attributeKey];
                if (docfieldValue)
                    setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results);
                break;
            case "component":
                docfieldValue = document[attribute.componentName] ? document[attribute.componentName][attributeKey] : null;
                if (docfieldValue)
                    setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, attribute.componentName);
                break;
            case "componentInZone":
                const section = document[attribute.zone];
                if (_.isArray(section)) {
                    for (const componentChild of section) {
                        docfieldValue = componentChild[attributeKey];
                        if (docfieldValue)
                            setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, componentChild.__component, attribute.zone);
                    }
                }
                break;
            case "nestedComponentInComponentInZone":
                const componentsName = attribute.zone.split("|");
                const zone = componentsName[0];
                const nestedCompoent = componentsName[1];
                const nestedInnerComponents = document[zone].filter(item => item.__component === nestedCompoent);
                if (nestedInnerComponents && nestedInnerComponents.length > 0) {
                    if (_.isArray(nestedInnerComponents[0][attribute.componentName])) {
                        nestedInnerComponents[0][attribute.componentName].forEach(element => {
                            docfieldValue = element[attributeKey];
                            if (docfieldValue)
                                setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, attribute.componentName, attribute.zone);
                        });
                    }
                    else {
                        docfieldValue = nestedInnerComponents[0][attribute.componentName][attributeKey];
                        if (docfieldValue)
                            setFields(page, document, apiName, tag, attributeKey, docfieldValue, text, results, attribute.componentName, attribute.zone);
                    }
                }
                break;
            default:
                break;
        }
        return results;
    };
    const filterResultsByFieldsCount = (results) => {
        const finalResults = _.groupBy(results, "frontUrl");
        let newResults = [];
        if (finalResults) {
            for (const result in finalResults) {
                //get the occurence with the bigger document fieldsets.
                newResults.push(finalResults[result].reduce((prev, curr) => {
                    return prev.documentFields.length > curr.documentFields.length ? prev : curr;
                }));
            }
        }
        return newResults;
    }
    const pushResultsInCollection = async (results) => {
        for (const result of results) {
            await analyseService().create({
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
    };
    const handleMatchErrors = (results) => {
        const finalResults = _.groupBy(results, "apiName");
        for (const result in finalResults) {
            let findedTitle = false;
            for (const resultArray of finalResults[result]) {
                const activeItems = resultArray.documentFields.filter(item => {
                    return item.tagName === "TITLE" || item.tagName === "META (description)"
                });
                if (activeItems && activeItems.length > 0) {
                    findedTitle = true;
                    const titleItems = activeItems.filter(item => item.tagName === "TITLE");
                    if (titleItems && titleItems.length > 1)
                        console.log("Error, mutiple title tags and fields found.", activeItems.filter(item => item.tagName === "TITLE"));
                    for (const field of activeItems) {
                        resultArray.documentFields.forEach(item => {
                            if (item.tagName !== "TITLE" && item.tagName !== "META (description)"
                                && (item.value === field.value || item.fieldName === field.fieldName)) {
                                item.status = "inactive";
                            }
                        });
                    }
                }
            }
            if (!findedTitle)
                console.log(`Error, No title tag found in ${result}`)
        }
    };
    const pushMatchesInCollection = async (results) => {
        let fields = [];
        handleMatchErrors(results);
        for (const result of results)
            fields = _.concat(fields, result.documentFields);
        fields = _.uniqBy(fields, v => [v.componentName, v.tagName, v.apiName, v.fieldName].join());

        for (const field of fields) {
            await matchService().create({
                apiName: field.apiName,
                componentName: field.componentName,
                tagName: field.tagName,
                fieldName: field.fieldName,
                dynamicZoneName: field.dynamicZoneName,
                status: field.status
            });
        }
    };
    const clear = async () => {
        await analyseService().deleteAll();
        await matchService().deleteAll();
    };
    const runRealTimeRulesAnalyze = async (payload) => {
        return analyzer.runSEORealTimeRulesAnalyse(payload);
    };
    /*const finalCheck = async () => {
        //const analyses = await analyseService().findMany();
        const matches = await matchService().findMany();
        const groupedMatchesByApiName = _.groupBy(matches, "apiName");
        for (const apiName in groupedMatchesByApiName) {
            const groupedMatchesByFieldName = _.groupBy(groupedMatchesByApiName[apiName], "fieldName");
            const populate = await getPopulateObjectForUID(apiName);
            const contentTypeDocuments = await strapi.query(apiName).findMany({
                populate: populate
            });
            for (const fieldName in groupedMatchesByFieldName) {
                if (groupedMatchesByFieldName[fieldName].length > 1) {
                    console.log("fieldName => ", fieldName, groupedMatchesByFieldName[fieldName]);
                    for (const doc of contentTypeDocuments) {
                        for (const match of groupedMatchesByFieldName[fieldName]) {
                            if (match.dynamicZoneName) {
                                if (match.dynamicZoneName.includes("|")) {
                                    const dynamicZoneNames = match.dynamicZoneName.split("|");
                                    const component = doc[dynamicZoneNames[0]].filter(item => item.__component === dynamicZoneNames[1]);
                                    if (component && component.length > 0) {
                                        const value = component[0][match.componentName][match.fieldName];
                                        const name = `${dynamicZoneNames[0]}.${dynamicZoneNames[1]}.${match.componentName}.${match.fieldName}`;
                                        console.log(`DYN COMP COMP ${name} ====>`, value);
                                    }
                                    else {
                                        console.log(`DYN COMP err ===> ${match.dynamicZoneName}`);
                                    }
                                }
                                else {
                                    const component = doc[match.dynamicZoneName].filter(item => item.__component === match.componentName);
                                    if (component && component.length > 0) {
                                        const value = component[0][match.fieldName];
                                        const name = `${match.dynamicZoneName}.${match.componentName}.${match.fieldName}`;
                                        console.log(`DYN COMP ${name} ====>`, value);
                                    }
                                    else {
                                        console.log(`DYN COMP err ===> ${match.dynamicZoneName}`);
                                    }
                                }
                            }
                            else {
                                if (match.componentName) {
                                    const value = doc[match.componentName][match.fieldName];
                                    const name = `${match.componentName}.${match.fieldName}`;
                                    console.log(`COMP + FIELD ${name} ====>`, value);
                                }
                                else {
                                    const value = doc[match.fieldName];
                                    const name = `${match.fieldName}`;
                                    console.log(`FIELD ${name} ====>`, value);
                                }
                            }

                        }
                    }
                }
            }
        }
    };*/
    return {
        getContentTypes,
        getComponentsToPopulate,
        getPopulateObjectForUID,
        getContents,
        runConsolidationProcess,
        getStrapiDocumentsByContentType,
        getAnalyzedPages,
        setFields,
        getAttributeComparaison,
        pushResultsInCollection,
        pushMatchesInCollection,
        clear,
        runRealTimeRulesAnalyze,
        //finalCheck
    };
}