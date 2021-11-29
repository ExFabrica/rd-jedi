import React, { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

//Layout
import { Box } from '@strapi/design-system/Box';
//Tab
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs';
// Analyse grids
import { AnalyseContentGrid } from './analyse-content-grid';
import { AnalyseFrontGrid } from './analyse-front-grid';
import { AnalyseExcludeGrid } from './analyse-exclude-grid';

export const AnalysePage = (props) => {
    const { formatMessage } = useIntl();
    const [seoForContent, setSeoForContent] = useState([]);
    const [seoForFront, setSeoForFront] = useState([]);

    useEffect(() => {
        if (props.value && props.value.seoAnalyse) {
            const analyses = JSON.parse(props.value.seoAnalyse);
            if(analyses && analyses.length > 0) { 
                //Analyses filtering for content Manager && front dev.
                setSeoForContent(analyses.filter(item => item.target === 0 || item.target === 2));
                setSeoForFront(analyses.filter(item => item.target === 1 || item.target === 2));
            }
        }
    }, []);

    return <Box padding={4} background="neutral0">
        <Box padding={8} background="primary100">
            <TabGroup label="Some stuff for the label" id="tabs" onTabChange={selected => console.log(selected)}>
                <Tabs>
                    <Tab>Content optimisation ({seoForContent.length})</Tab>
                    <Tab>Front optimisation ({seoForFront.length})</Tab>
                    <Tab>Don't show again</Tab>
                </Tabs>
                <TabPanels>
                    <TabPanel>
                        <AnalyseContentGrid value={seoForContent}></AnalyseContentGrid>
                    </TabPanel>
                    <TabPanel>
                        <Box padding={4} background="neutral0">
                            <AnalyseFrontGrid value={seoForFront}></AnalyseFrontGrid>
                        </Box>
                    </TabPanel>
                    <TabPanel>
                        <Box padding={4} background="neutral0">
                            <AnalyseExcludeGrid value={[]}></AnalyseExcludeGrid>
                        </Box>
                    </TabPanel>
                </TabPanels>
            </TabGroup>
        </Box>
    </Box>
};

AnalysePage.defaultProps = {
    value: null,
};

AnalysePage.propTypes = {
    value: PropTypes.object,
};