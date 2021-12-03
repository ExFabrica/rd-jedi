import React, { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

//Layout
import { Box } from '@strapi/design-system/Box';
import { Stack } from '@strapi/design-system/Stack';
//Accordion
import { Accordion, AccordionToggle, AccordionContent } from '@strapi/design-system/Accordion';
import { IconButton } from '@strapi/design-system/IconButton';
import Globe from '@strapi/icons/Globe';
import Pencil from '@strapi/icons/Pencil';
//Tab
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs';
// Analyse grids
import { AnalyseContentGrid } from './analyse-content-grid';
import { AnalyseFrontGrid } from './analyse-front-grid';
import { AnalyseExcludeGrid } from './analyse-exclude-grid';
//Modal
import { ModalEditTitle } from './analyse-modal-edit-title';

export const AnalyseAccordion = (props) => {
    const { formatMessage } = useIntl();
    const [seoContentManagerMessageList, setSeoContentManagerMessageList] = useState([]);
    const [seoFrontDeveloperMessageList, setSeoFrontDeveloperMessageList] = useState([]);
    const [seoExcludeMessageList, setSeoExcludeMessageList] = useState([]);
    const [editTitleModalVisible, setEditTitleModalVisible] = useState(false);

    useEffect(() => {
        if (props.value && props.value.seoAnalyse) {
            const analyses = JSON.parse(props.value.seoAnalyse);
            if (analyses && analyses.length > 0) {
                //Analyses filtering for content Manager && front dev.
                setSeoContentManagerMessageList(analyses.filter(item => item.target === 0 || item.target === 2));
                setSeoFrontDeveloperMessageList(analyses.filter(item => item.target === 1 || item.target === 2));
                setSeoExcludeMessageList([{
                    message: "test",
                    priority: 70,
                    target: 0,
                    content: ""
                }]);
            }
        }
    }, []);

    return <Accordion key={props.id} expanded={props.toggleState[props.id]} toggle={() => props.onToggle(props.id)} id={props.id}>
        <AccordionToggle startIcon={<Globe aria-hidden={true} />} action={<Stack horizontal size={0}>
            <IconButton noBorder onClick={() => setEditTitleModalVisible(prev => !prev)} label="Edit" icon={<Pencil />} />
        </Stack>} title={props.value.frontUrl} togglePosition="left" />
        <AccordionContent>
            <Box padding={3}>
                <Box padding={4} background="neutral0">
                    <Box padding={8} background="primary100">
                        <TabGroup label="Some stuff for the label" id="tabs" onTabChange={selected => console.log(selected)}>
                            <Tabs>
                                <Tab>Content optimisation ({seoContentManagerMessageList.length})</Tab>
                                <Tab>Front optimisation ({seoFrontDeveloperMessageList.length})</Tab>
                                <Tab>Don't show again ({seoExcludeMessageList.length})</Tab>
                            </Tabs>
                            <TabPanels>
                                <TabPanel>
                                    <AnalyseContentGrid value={seoContentManagerMessageList}></AnalyseContentGrid>
                                </TabPanel>
                                <TabPanel>
                                    <Box padding={4} background="neutral0">
                                        <AnalyseFrontGrid value={seoFrontDeveloperMessageList}></AnalyseFrontGrid>
                                    </Box>
                                </TabPanel>
                                <TabPanel>
                                    <Box padding={4} background="neutral0">
                                        <AnalyseExcludeGrid value={seoExcludeMessageList}></AnalyseExcludeGrid>
                                    </Box>
                                </TabPanel>
                            </TabPanels>
                        </TabGroup>
                    </Box>
                </Box>
            </Box>
        </AccordionContent>
        <ModalEditTitle
            isVisible={editTitleModalVisible}
            onClose={() => { setEditTitleModalVisible(prev => !prev) }}
            onSave={() => { setEditTitleModalVisible(prev => !prev) }}
            value={props.value.frontUrl}>
        </ModalEditTitle>
    </Accordion>
};

AnalyseAccordion.defaultProps = {
    value: null,
    id: "id",
    onToggle: (id) => { },
    toggleState: [],
};

AnalyseAccordion.propTypes = {
    value: PropTypes.object,
    id: PropTypes.string,
    onToggle: PropTypes.func,
    toggleState: PropTypes.object
};