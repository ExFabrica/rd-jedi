import React, { useEffect, useState } from 'react';
import { useCMEditViewDataManager, request } from '@strapi/helper-plugin';

export const StrapiUIRefresher = () => {
    const context = useCMEditViewDataManager();
    const { initialData, modifiedData } = context;
    const [inputsCollection, setInputsCollection] = useState([]);
    const [documentFields, setDocumentFields] = useState([]);
    const [initDone, setInitDone] = useState(false);

    useEffect(() => {
        console.log("documentFields change");
        HtmlLookup();
    }, [documentFields.length]);

    useEffect(() => {
        console.log("inputsCollection change");
        HtmlLookup();
    }, [inputsCollection.length]);

    useEffect(() => {
        console.log("modifiedData change");
        setInputsCollection([]);
        let inputsCollection = Array.from(document.getElementsByTagName("input"));
        inputsCollection = inputsCollection.concat(Array.from(document.getElementsByTagName("textarea")));
        setInputsCollection([...inputsCollection]);
    }, [modifiedData]);

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

    const containsAny = (str, substrings) => {
        //console.log("Input Name", str);
        //console.log("Array of name", substrings);
        for (var i = 0; i != substrings.length; i++) {
            var substring = substrings[i];
            if (str.indexOf(substring) === - 1) {
                return null;
            }
        }
        return null;
    }

    const createAnalyzerPanel = (inputItem, tagName) => {
        let div = document.createElement("div");
        div.id = `${inputItem.id}_analyzer`;
        const text = document.createTextNode(`On the front -> ${tagName}`);
        div.appendChild(text);
        const inputItemHtmlControl = document.getElementById(inputItem.id);
        if (inputItemHtmlControl)
            inputItemHtmlControl.parentNode?.parentNode?.appendChild(div);
    }

    const HtmlLookup = () => {
        for (const documentField of documentFields) {
            for (const inputItem of inputsCollection) {
                const parentNode = document.getElementById(`${inputItem.id}_analyzer`);
                if (!parentNode) {
                    if (documentField.componentName) {
                        //Dynamic Zone component
                        if (documentField.dynamicZoneName) {
                            if (!initDone) {
                                if (initialData[documentField.dynamicZoneName] && initialData[documentField.dynamicZoneName].length > 0) {
                                    for (let i = 0; i < initialData[documentField.dynamicZoneName].length; i++) {
                                        if (documentField.componentName === initialData[documentField.dynamicZoneName][i].__component) {
                                            const inputName = `${documentField.dynamicZoneName}.${i}.${documentField.fieldName}`;
                                            if (inputName === inputItem.name) {
                                                createAnalyzerPanel(inputItem, documentField.tagName);
                                                break;
                                            }
                                        }
                                    }
                                }
                                setInitDone(true);
                            }
                            else {
                                if (modifiedData[documentField.dynamicZoneName] && modifiedData[documentField.dynamicZoneName].length > 0) {
                                    for (let i = 0; i < modifiedData[documentField.dynamicZoneName].length; i++) {
                                        if (documentField.componentName === modifiedData[documentField.dynamicZoneName][i].__component) {
                                            const inputName = `${documentField.dynamicZoneName}.${i}.${documentField.fieldName}`;
                                            if (inputName === inputItem.name) {
                                                createAnalyzerPanel(inputItem, documentField.tagName);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        //simple component
                        else {
                            if (inputItem.name === `${documentField.componentName}.${documentField.fieldName}`)
                                createAnalyzerPanel(inputItem, documentField.tagName);
                        }
                    }
                    else {
                        //simple field
                        if (inputItem.name === documentField.fieldName) {
                            createAnalyzerPanel(inputItem, documentField.tagName);
                        }
                    }
                }
                else
                    parentNode.style.border = "1px solid red";
            }
        }
    }

    return <></>;
}