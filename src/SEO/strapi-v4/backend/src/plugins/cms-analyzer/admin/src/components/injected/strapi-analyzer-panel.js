import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useCMEditViewDataManager, request } from '@strapi/helper-plugin';

//Layout
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Stack } from '@strapi/design-system/Stack';

//Middleware
const _uiContentAnalyzer = require("../../middlewares/analyzer/ui-contentAnalyzer").default;

const ComponentStyleDiv = styled.div`
  position:fixed;
  bottom:20px;
  right:20px;
  width:360px;
  height:500px;
  overflow-x:hidden;
  overflow-y:auto;
`;

export const StrapiAnalyzerPanel = ({ show }) => {
    const context = useCMEditViewDataManager();
    const [screenshot, setScreenshot] = useState();
    const [seoAnalyseErrors, setSeoAnalyzeErrors] = useState();
    const [seoAnalyseWarnings, setSeoAnalyzeWarnings] = useState();
    const [frontUrl, setFrontUrl] = useState();

    if (context && context.modifiedData)
        useEffect(() => {
            if (context.modifiedData.id) {
                _uiContentAnalyzer.getAnalysesByDocumentId(context.modifiedData.id)
                    .then(result => {
                        if (result) {
                            setFrontUrl(result.frontUrl);
                            if (result.screenshot)
                                setScreenshot(result.screenshot);
                            if (result.seoAnalyse) {
                                const seos = JSON.parse(result.seoAnalyse);
                                if (seos) {
                                    setSeoAnalyzeErrors(seos.filter(item => item.target === 0 || item.target === 2 && item.level === "errors"));
                                    setSeoAnalyzeWarnings(seos.filter(item => item.target === 0 || item.target === 2 && item.level === "warnings"));
                                }
                            }
                        }
                    });
            }
        }, [context.modifiedData]);

    return show && context && context.modifiedData ? <ComponentStyleDiv>
        <Box padding={4} background="neutral0">
            <div>
                Preview
                <br />
                <figure>
                    <a target="_blank" href={frontUrl} alt={frontUrl}><img width="300px" src={screenshot} /></a>
                    <figcaption>Open front page</figcaption>
                </figure>
            </div>

            {seoAnalyseWarnings || seoAnalyseErrors ?
                <div>
                    Seo rules to check
                    <br />
                    {seoAnalyseErrors && seoAnalyseErrors.length > 0 ?
                        <>
                            Errors
                            <ol className="errors">
                                {seoAnalyseErrors.map(item => <li key={`${item.message}_${item.content}`}>{item.message}<br />{item.content}</li>)}
                            </ol>
                            <br />
                        </>
                        : <></>}

                    {seoAnalyseWarnings && seoAnalyseWarnings.length > 0 ?
                        <>
                            Warnings
                            <ol className="warnings">
                                {seoAnalyseWarnings.map(item => {
                                    if (!item.message.includes("Images should have alt tags"))
                                        return <li key={`${item.message}_${item.content}`}>{item.message}<br />{item.content}</li>
                                    else
                                        return <li key={`${item.message}_${item.content}`}>{item.message}<br /><img src={item.content} width="100px" alt="Images should have alt tags" /></li>
                                })}
                            </ol>
                        </>
                        : <></>
                    }
                </div> : <></>}
        </Box>
    </ComponentStyleDiv> :
        <></>
}

StrapiAnalyzerPanel.defaultProps = {
    show: true
};

StrapiAnalyzerPanel.propTypes = {
    show: PropTypes.bool
};