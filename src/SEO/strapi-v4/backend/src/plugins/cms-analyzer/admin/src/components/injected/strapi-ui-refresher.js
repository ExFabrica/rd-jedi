import React, { useEffect, useState } from 'react';
import { useCMEditViewDataManager, request } from '@strapi/helper-plugin';

export const StrapiUIRefresher = () => {
    const context = useCMEditViewDataManager();
    const { modifiedData } = context;
    const [inputsCollection, setInputsCollection] = useState([]);
    const [documentFields, setDocumentFields] = useState([]);

    useEffect(() => {
        HtmlLookup();
    }, [documentFields.length, inputsCollection.length, modifiedData]);

    useEffect(() => {
        request(`/cms-analyzer/matches/uid/${context.slug}`, {
            method: 'GET'
        }).then(result => {
            console.log("result", result);
            if (result)
                setDocumentFields(result);
        });

        const interval = window.setInterval(() => {
            let inputsCollection = Array.from(document.getElementsByTagName("input"));
            inputsCollection = inputsCollection.concat(Array.from(document.getElementsByTagName("textarea")));
            setInputsCollection(inputsCollection);
        }, 300);
        return () => clearInterval(interval);
    }, []);

    const createAnalyzerPanel = (inputItem, tagName) => {
        let div = document.createElement("div");
        div.id = `${inputItem.id}_analyzer`;
        const text = document.createTextNode(`On the front -> ${tagName}`);
        div.appendChild(text);
        const inputItemHtmlControl = document.getElementById(inputItem.id);
        if (inputItemHtmlControl) {
            const parent = inputItemHtmlControl.parentNode?.parentNode;
            if (parent) {
                parent.appendChild(div);
                parent.style.border = "1px solid red";
            }
        }
    }

    const removeAnalyzerStrapiTags = () => {
        const analyzerDivList = document.querySelectorAll("[id$='_analyzer']");
        if (analyzerDivList && analyzerDivList.length > 0)
            analyzerDivList.forEach(node => {
                node.remove();
            });
    }

    const HtmlLookup = () => {
        removeAnalyzerStrapiTags();
        for (const documentField of documentFields) {
            if (documentField.componentName) {
                //Dynamic Zone component
                if (documentField.dynamicZoneName) {
                    if (modifiedData && modifiedData[documentField.dynamicZoneName]) {
                        const dynamicZoneComponents = modifiedData[documentField.dynamicZoneName].map(item => item.__component);
                        console.log("dynamicZoneComponents", dynamicZoneComponents);

                        const index = dynamicZoneComponents.indexOf(documentField.componentName);
                        if (index > -1) {
                            const inputName = `${documentField.dynamicZoneName}.${index}.${documentField.fieldName}`;
                            console.log("index", index, inputName, documentField.componentName);
                            const inputItem = document.getElementById(inputName);
                            if (inputItem)
                                createAnalyzerPanel(inputItem, documentField.tagName);
                        }
                    }
                }
                //simple component
                else {
                    const inputName = `${documentField.componentName}.${documentField.fieldName}`;
                    const inputItem = document.getElementById(inputName);
                    createAnalyzerPanel(inputItem, documentField.tagName);
                }
            }
            else {
                //simple field
                const inputItem = document.getElementById(documentField.fieldName);
                createAnalyzerPanel(inputItem, documentField.tagName);
            }
            //}
        }
    }

    return <></>;
}