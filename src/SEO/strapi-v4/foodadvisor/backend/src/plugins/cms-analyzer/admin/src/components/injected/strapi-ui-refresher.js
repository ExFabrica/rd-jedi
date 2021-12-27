import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// tools from helper
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
//Badge
import { Badge } from '@strapi/design-system/Badge';
//Typography
import { Typography } from '@strapi/design-system/Typography';
//Box
import { Box } from '@strapi/design-system/Box';
const contentAnalyzerAPI = require("../../api/seo/seo-api-wrapper").default;

export const StrapiUIRefresher = () => {
    const context = useCMEditViewDataManager();
    const { modifiedData } = context;
    const [nodeElementsCollectionCount, setNodeElementsCollectionCount] = useState(0);
    const [structureFields, setStructureFields] = useState([]);
    const [seoAnalyses, setSeoAnalyses] = useState([]);
    const [structure, setStructure] = useState([]);

    useEffect(() => {
        getAnalyses(structure);
    }, [structure]);

    useEffect(() => {
        HtmlLookup();
    }, [seoAnalyses]);

    useEffect(() => {
        setStructure(HtmlLookup());
    }, [nodeElementsCollectionCount, modifiedData]);

    useEffect(() => {
        contentAnalyzerAPI.getMatchesByUID(context.slug).then(result => {
            if (result) {
                setStructureFields(result);
                countAllTags();
            }
        });

        const interval = window.setInterval(() => {
            countAllTags();
        }, 500);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const countAllTags = () => {
        const count = document.querySelectorAll('*').length;
        setNodeElementsCollectionCount(count);
    }

    const updateInputLabel = (tagName, parent) => {
        const label = parent.querySelector("label");
        if (!label.innerText.includes(`(${tagName})`)) {
            if (!label.innerText.includes(`(`))
                label.innerText = `${label.innerText} (${tagName})`;
            else
                label.innerText = `${label.innerText} or (${tagName})`;
        }
    }

    const removeAnalyzerPanels = (name) => {
        const containers = document.querySelectorAll(`[id$='${name}_analyzer']`);
        if (containers && containers.length > 0)
            containers.forEach(container => {
                container.remove();
            });
    }

    const createRuleDisplayPanel = (inputItem, parent) => {
        if (inputItem) {
            removeAnalyzerPanels(inputItem.name);
            const filteredAnalyses = seoAnalyses.filter(item => item.payload.name === inputItem.name);
            if (filteredAnalyses && filteredAnalyses.length > 0) {
                let index = 0;
                for (const filteredAnalyse of filteredAnalyses) {
                    const analyseDiv = document.querySelector(`[id='${filteredAnalyse.id}']`);
                    const analyserDiv = document.querySelector(`[id='${index}.${filteredAnalyse.payload.name}_analyzer']`);
                    if (!analyserDiv) {
                        let div = document.createElement("div");
                        div.id = `${index}.${filteredAnalyse.payload.name}_analyzer`;
                        div.innerHTML = analyseDiv.innerHTML;
                        parent.appendChild(div);
                    }
                    else
                        analyserDiv.innerHTML = analyseDiv.innerHTML;
                    index++;
                }
            }
        }
    }

    const createAnalyzerPanel = (inputItem, tagName) => {
        const inputItemHtmlControl = document.querySelector(`[id='${inputItem.id}']`);
        if (inputItemHtmlControl) {
            const parent = inputItemHtmlControl.parentNode?.parentNode;
            if (parent) {
                createRuleDisplayPanel(inputItem, parent);
                updateInputLabel(tagName, parent);
            }
        }
    }

    const getAnalyses = async (structure) => {
        if (structure && structure.length > 0) {
            let title = "";
            const titleRows = structure.filter(item => item.tagName === "TITLE");
            if (titleRows && titleRows.length > 0)
                title = titleRows[0].value;
            const payload = structure.map(item => {
                return { tag: item.tagName, value: item.value, titleValue: title, name: item.name };
            });
            //console.debug("Payload", payload);
            const results = await contentAnalyzerAPI.getRealTimeRulesAnalyze(payload);
            if (results) {
                results.forEach(item => item["id"] = uuidv4());
                //console.log('SeoAnalyses', results);
                setSeoAnalyses(results);
            }
        }
    }

    //TODO refactor this big method.
    const HtmlLookup = () => {
        let structure = [];
        for (const structureField of structureFields) {
            if (structureField.componentName) {
                //Dynamic Zone component
                if (structureField.dynamicZoneName) {
                    if (!structureField.dynamicZoneName.includes("|")) {
                        if (modifiedData && modifiedData[structureField.dynamicZoneName]) {
                            const dynamicZoneComponents = modifiedData[structureField.dynamicZoneName].map(item => item.__component);
                            const index = dynamicZoneComponents.indexOf(structureField.componentName);
                            if (index > -1) {
                                const inputName = `${structureField.dynamicZoneName}.${index}.${structureField.fieldName}`;
                                const inputItem = document.getElementById(inputName);
                                if (inputItem) {
                                    structure.push({ tagName: structureField.tagName, name: inputName, value: inputItem.value });
                                    createAnalyzerPanel(inputItem, structureField.tagName);
                                }
                            }
                        }
                    }
                    else {
                        const splittedNames = structureField.dynamicZoneName.split("|");
                        const dynamicZoneName = splittedNames[0];
                        const componentName = splittedNames[1];
                        if (modifiedData && modifiedData[dynamicZoneName]) {
                            const dynamicZoneComponents = modifiedData[dynamicZoneName].map(item => item.__component);
                            const componentIndex = dynamicZoneComponents.indexOf(componentName);
                            if (componentIndex > -1) {
                                const documentParentComponent = modifiedData[dynamicZoneName].filter(item => item.__component === componentName);
                                if (documentParentComponent && documentParentComponent.length > 0) {
                                    const innerComponent = documentParentComponent[0][structureField.componentName];
                                    if (_.isArray(innerComponent)) {
                                        innerComponent.forEach((element, index) => {
                                            const inputName = `${dynamicZoneName}.${componentIndex}.${structureField.componentName}.${index}.${structureField.fieldName}`;
                                            const inputItem = document.getElementById(inputName);
                                            if (inputItem) {
                                                structure.push({ tagName: structureField.tagName, name: inputName, value: inputItem.value });
                                                createAnalyzerPanel(inputItem, structureField.tagName);
                                            }
                                        });
                                    }
                                    else {
                                        const inputName = `${dynamicZoneName}.${componentIndex}.${structureField.componentName}.${structureField.fieldName}`;
                                        const inputItem = document.getElementById(inputName);
                                        if (inputItem) {
                                            structure.push({ tagName: structureField.tagName, name: inputName, value: inputItem.value });
                                            createAnalyzerPanel(inputItem, structureField.tagName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                //simple component
                else {
                    const inputName = `${structureField.componentName}.${structureField.fieldName}`;
                    const inputItem = document.getElementById(inputName);
                    if (inputItem) {
                        structure.push({ tagName: structureField.tagName, name: inputName, value: inputItem.value });
                        createAnalyzerPanel(inputItem, structureField.tagName);
                    }
                }
            }
            else {
                //simple field
                const inputItem = document.getElementById(structureField.fieldName);
                if (inputItem) {
                    structure.push({ tagName: structureField.tagName, name: inputItem.name, value: inputItem.value });
                    createAnalyzerPanel(inputItem, structureField.tagName);
                }
            }
        }
        return structure;
    }

    return <>
        <div id="analyzer-rules-content" style={{ display: "none" }}>
            {seoAnalyses && seoAnalyses.length > 0 ?
                seoAnalyses.map(item => {
                    return item.level === "warnings"
                        ? <Box key={item.id} id={item.id}>
                            <Badge backgroundColor="danger500" textColor="neutral0" paddingLeft="3" paddingRight="3">Low</Badge>
                            &nbsp;<Typography textColor="danger500" marginLeft="10" variant="pi">{item.message}</Typography>
                        </Box>
                        : <Box key={item.id} id={item.id}>
                            <Badge backgroundColor="danger700" textColor="neutral0" paddingLeft="3" paddingRight="3">High</Badge>
                            &nbsp;<Typography textColor="danger700" marginLeft="10" variant="pi">{item.message}</Typography>
                        </Box>
                }) : <></>
            }
        </div>
    </>;
}