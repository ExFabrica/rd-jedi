import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// tools from helper
import { useCMEditViewDataManager, request } from '@strapi/helper-plugin';
//Badge
import { Badge } from '@strapi/design-system/Badge';
//Typography
import { Typography } from '@strapi/design-system/Typography';
//Box
import { Box } from '@strapi/design-system/Box';

export const StrapiUIRefresher = () => {
    const context = useCMEditViewDataManager();
    const { modifiedData } = context;
    const [nodeElementsCollectionCount, setNodeElementsCollectionCount] = useState(0);
    const [structureFields, setStructureFields] = useState([]);
    const [seoAnalyses, setSeoAnalyses] = useState([]);
    const [structure, setStructure] = useState([]);
    const [isStructureRunning, setIsStructureRunning] = useState(false);

    useEffect(() => {
        if (!isStructureRunning)
            HtmlLookup();
    }, [nodeElementsCollectionCount, modifiedData]);

    useEffect(() => {
        request(`/cms-analyzer/analyses/documents/${modifiedData.id}`, {
            method: 'GET'
        }).then(result => {
            const seoAnalyses = JSON.parse(result.seoAnalyse);
            seoAnalyses.forEach(item => item["id"] = uuidv4());
            setSeoAnalyses(seoAnalyses);
        });

        request(`/cms-analyzer/matches/uid/${context.slug}`, {
            method: 'GET'
        }).then(result => {
            if (result)
                setStructureFields(result);
        });

        const interval = window.setInterval(() => {
            const count = document.querySelectorAll('*').length;
            setNodeElementsCollectionCount(count);
        }, 200);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const updateInputLabel = (tagName, parent) => {
        const label = parent.querySelector("label");
        if (!label.innerText.includes(`(${tagName})`))
            if (!label.innerText.includes(`(`))
                label.innerText = `${label.innerText} (${tagName})`;
            else
                label.innerText = `${label.innerText} or (${tagName})`;
    }

    const createRuleDisplayPanel = (inputItem, parent) => {
        if (inputItem && inputItem.value) {
            const seoAnalyse = seoAnalyses.filter(item => item.content === inputItem.value);
            if (seoAnalyse && seoAnalyse.length > 0) {
                const analyseDiv = document.getElementById(seoAnalyse[0].id);
                if (analyseDiv && analyseDiv.innerHTML) {
                    let div = document.createElement("div");
                    div.id = `${inputItem.id}_analyzer`;
                    div.innerHTML = analyseDiv.innerHTML;
                    parent.appendChild(div);
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

    const removeAnalyzerStrapiContainers = () => {
        const containers = document.querySelectorAll("[id$='_analyzer']");
        if (containers && containers.length > 0)
            containers.forEach(container => {
                container.remove();
            });
    }

    //TODO refactor this big method.
    const HtmlLookup = () => {
        const tempStructure = [];
        setIsStructureRunning(true);
        removeAnalyzerStrapiContainers();
        setStructure([]);
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
                                    tempStructure.push({ type: "ZC", keys: [structureField.dynamicZoneName, index, structureField.fieldName] });
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
                                                tempStructure.push({ type: "ZCICA", keys: [dynamicZoneName, componentIndex, structureField.componentName, index, structureField.fieldName] });
                                                createAnalyzerPanel(inputItem, structureField.tagName);
                                            }
                                        });
                                    }
                                    else {
                                        const inputName = `${dynamicZoneName}.${componentIndex}.${structureField.componentName}.${structureField.fieldName}`;
                                        const inputItem = document.getElementById(inputName);
                                        if (inputItem) {
                                            tempStructure.push({ type: "ZCIC", keys: [dynamicZoneName, componentIndex, structureField.componentName, structureField.fieldName] });
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
                        tempStructure.push({ type: "SC", keys: [structureField.componentName, structureField.fieldName] });
                        createAnalyzerPanel(inputItem, structureField.tagName);
                    }
                }
            }
            else {
                //simple field
                const inputItem = document.getElementById(structureField.fieldName);
                if (inputItem) {
                    tempStructure.push({ type: "SF", keys: [structureField.fieldName] });
                    createAnalyzerPanel(inputItem, structureField.tagName);
                }
            }
        }
        setIsStructureRunning(false);
        setStructure(tempStructure);
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