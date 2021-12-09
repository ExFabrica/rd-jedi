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
    const [inputsCollection, setInputsCollection] = useState([]);
    const [structureFields, setStructureFields] = useState([]);
    const [seoAnalyses, setSeoAnalyses] = useState([]);

    useEffect(() => {
        console.log("inputsCollection update");
        HtmlLookup();
    }, [structureFields.length, inputsCollection.length]);

    useEffect(() => {
        console.log("modifiedData update");
        HtmlLookup();
    }, [modifiedData]);

    useEffect(() => {
        request(`/cms-analyzer/matches/uid/${context.slug}`, {
            method: 'GET'
        }).then(result => {
            if (result)
                setStructureFields(result);
        });

        request(`/cms-analyzer/analyses/documents/${modifiedData.id}`, {
            method: 'GET'
        }).then(result => {
            const seoAnalyses = JSON.parse(result.seoAnalyse);
            for (let analyse of seoAnalyses) {
                analyse["id"] = uuidv4();
            }
            console.log("seoAnalyses", seoAnalyses);
            setSeoAnalyses(seoAnalyses);
        });

        const interval = window.setInterval(() => {
            let inputsCollection = Array.from(document.getElementsByTagName("input"));
            inputsCollection = inputsCollection.concat(Array.from(document.getElementsByTagName("textarea")));
            setInputsCollection(inputsCollection);
        }, 300);
        return () => clearInterval(interval);
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
        const inputItemHtmlControl = document.getElementById(inputItem.id);

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

    const HtmlLookup = () => {
        removeAnalyzerStrapiContainers();
        for (const documentField of structureFields) {
            if (documentField.componentName) {
                //Dynamic Zone component
                if (documentField.dynamicZoneName) {
                    if (!documentField.dynamicZoneName.includes("|")) {
                        if (modifiedData && modifiedData[documentField.dynamicZoneName]) {
                            const dynamicZoneComponents = modifiedData[documentField.dynamicZoneName].map(item => item.__component);
                            const index = dynamicZoneComponents.indexOf(documentField.componentName);
                            if (index > -1) {
                                const inputName = `${documentField.dynamicZoneName}.${index}.${documentField.fieldName}`;
                                const inputItem = document.getElementById(inputName);
                                if (inputItem)
                                    createAnalyzerPanel(inputItem, documentField.tagName);
                            }
                        }
                    }
                    else {
                        const splittedNames = documentField.dynamicZoneName.split("|");
                        const dynamicZoneName = splittedNames[0];
                        const componentName = splittedNames[1];
                        if (modifiedData && modifiedData[dynamicZoneName]) {
                            const dynamicZoneComponents = modifiedData[dynamicZoneName].map(item => item.__component);
                            const componentIndex = dynamicZoneComponents.indexOf(componentName);
                            if (componentIndex > -1) {
                                const documentParentComponent = modifiedData[dynamicZoneName].filter(item => item.__component === componentName);
                                if (documentParentComponent && documentParentComponent.length > 0) {
                                    const innerComponent = documentParentComponent[0][documentField.componentName];
                                    if (_.isArray(innerComponent)) {
                                        innerComponent.forEach((element, index) => {
                                            const inputName = `${dynamicZoneName}.${componentIndex}.${documentField.componentName}.${index}.${documentField.fieldName}`;
                                            //console.log("inputName", inputName);
                                            const inputItem = document.getElementById(inputName);
                                            if (inputItem)
                                                createAnalyzerPanel(inputItem, documentField.tagName);
                                        });
                                    }
                                    else {
                                        const inputName = `${dynamicZoneName}.${componentIndex}.${documentField.componentName}.${documentField.fieldName}`;
                                        const inputItem = document.getElementById(inputName);
                                        if (inputItem)
                                            createAnalyzerPanel(inputItem, documentField.tagName);
                                    }
                                }
                            }
                        }
                    }
                }
                //simple component
                else {
                    const inputName = `${documentField.componentName}.${documentField.fieldName}`;
                    const inputItem = document.getElementById(inputName);
                    if (inputItem)
                        createAnalyzerPanel(inputItem, documentField.tagName);
                }
            }
            else {
                //simple field
                const inputItem = document.getElementById(documentField.fieldName);
                if (inputItem)
                    createAnalyzerPanel(inputItem, documentField.tagName);
            }
        }
    }

    return <>
        <div id="analyzer-rules-content" style={{ display: "none" }}>
            {seoAnalyses && seoAnalyses.length > 0 ?
                seoAnalyses.map(item => {
                    return item.level === "warnings"
                        ? <Box key={item.id} id={item.id}>
                            <Badge backgroundColor="danger500" textColor="neutral0" paddingLeft="3" paddingRight="3">Low</Badge>
                            &nbsp;<Typography textColor="neutral800" marginLeft="10">{item.message}</Typography>
                        </Box>
                        : <Box key={item.id} id={item.id}>
                            <Badge backgroundColor="danger700" textColor="neutral0" paddingLeft="3" paddingRight="3">High</Badge>
                            &nbsp;<Typography textColor="neutral800" marginLeft="10">{item.message}</Typography>
                        </Box>
                }) : <></>
            }
        </div>
    </>;
}