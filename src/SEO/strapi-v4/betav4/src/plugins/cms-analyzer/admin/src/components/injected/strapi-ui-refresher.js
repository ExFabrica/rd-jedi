import React, { useEffect, useState } from 'react';
import { useCMEditViewDataManager, request } from '@strapi/helper-plugin';

export const StrapiUIRefresher = () => {
    const { modifiedData } = useCMEditViewDataManager();
    const [inputsCollection, setInputsCollection] = useState([]);

    const [documentFields, setDocumentFields] = useState([]);

    useEffect(() => {
        request(`/cms-analyzer/analyses/documents/${modifiedData.id}`, {
            method: 'GET'
        }).then(result => {
            setDocumentFields(JSON.parse(result.documentFields));
        });
    }, [modifiedData]);

    useEffect(() => {
        HtmlLookup();
    }, [documentFields.length, inputsCollection.length]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            let inputsCollection = Array.from(document.getElementsByTagName("input"));
            inputsCollection = inputsCollection.concat(Array.from(document.getElementsByTagName("textarea")));
            setInputsCollection(inputsCollection);
        }, 300);
        return () => clearInterval(interval);
    }, []);

    const HtmlLookup = () => {
        console.debug("Html Lookup");
        for (const documentField of documentFields) {
            for (const inputItem of inputsCollection) {
                if (inputItem.style.borderWidth !== "red") {
                    if (inputItem.value.toLowerCase() === documentField.value.toLowerCase()) {
                        inputItem.style.borderWidth = "1px";
                        inputItem.style.borderColor = "red";
                        const label = document.querySelector("label[for='" + inputItem.id + "']");
                        if (!label.innerHTML.includes("TAG")) {
                            label.innerHTML = `${label.innerHTML} (front TAG: ${documentField.tagName})`
                            label.style.color = "red";
                        }
                    }
                }
            }
        }
    }

    return <></>;
}