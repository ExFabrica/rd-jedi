/*
 *
 * HomePage
 *
 */
import React, { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../utils/getTrad';
import settingsMiddleware from '../../middlewares/settings/ui-settings';
import contentAnalyzerMiddleware from '../../middlewares/analyzer/ui-contentAnalyzer';
import { Link } from "react-router-dom";
import GenericGrid from './components/genericGrid';

import { Stack } from '@strapi/design-system/Stack';
import { Main } from '@strapi/design-system/Main';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { H2, H3, Text } from '@strapi/design-system/Text';
import { Button } from '@strapi/design-system/Button';
import Plus from '@strapi/icons/Plus';
import { ContentLayout, HeaderLayout, Layout } from '@strapi/design-system/Layout';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import {
  CheckPagePermissions,
  LoadingIndicatorPage,
  useNotification,
} from '@strapi/helper-plugin';
import { ToggleInput } from '@strapi/design-system/ToggleInput';

//TABLE
import Pencil from '@strapi/icons/Pencil';
import Trash from '@strapi/icons/Trash';
import { VisuallyHidden } from '@strapi/design-system/VisuallyHidden';
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox';
import { Table, Thead, Tbody, Tr, Td, Th, TFooter } from '@strapi/design-system/Table';
import { Typography } from '@strapi/design-system/Typography';
import { Avatar } from '@strapi/design-system/Avatar';
import { IconButton } from '@strapi/design-system/IconButton';
//TAB
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs';
import { Badge } from '@strapi/design-system/Badge';


const HomePage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState();
  const [isLoading, setIsLoading] = useState();

  const ROW_COUNT = 6;
  const COL_COUNT = 10;
  const entry = {
    cover: 'https://avatars.githubusercontent.com/u/3874873?v=4',
    description: 'Chez Léon is a human sized Parisian',
    category: 'French cuisine',
    contact: 'Leon Lafrite'
  };
  const [entries, setEntries] = useState([]);


  useEffect(() => {
    console.log("getAnalyses component mount");
    try {
      contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
        console.log("getAnalyses analyses ", analyses);
        setResults(analyses);


        let entries = [];
        for (let i = 0; i < 5; i++) {
          entries.push({
            ...entry,
            id: i
          });
        }
        setEntries(entries);

      }, (err) => {
        console.log(err);
      });
      settingsMiddleware.get().then(settings => {
        setSettings(settings);
      });
    }
    catch (err) {
      console.log("getAnalyses component mount try catch: ", err);
    }
  }, []);

  const handleSubmit = () => {
    console.log("handleSubmit Click");
    setIsLoading(true);
    try {
      contentAnalyzerMiddleware.runConsolidation(settings.frontUrl).then((result) => {
        console.log("runConsolidation result ", result);
        if (result.success) {
          contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
            console.log("runConsolidation getAnalyses analyses ", analyses);
            setResults(analyses);
            setIsLoading(false);
          });
        }
      }, (err) => {
        console.log(err);
      });
    } catch (err) {
      console.log("handleSubmit try catch err ", err);
    }
  }

  return <Main labelledBy="title" aria-busy={isLoading}>
    <HeaderLayout
      id="title"
      title={formatMessage({ id: getTrad("plugin.homepage.title") })}
      subtitle={formatMessage({ id: getTrad("plugin.settings.subtitle") })}
      primaryAction={
        <Button onClick={handleSubmit} startIcon={<Plus />} size="L" >
          {"Run Analyzer"}
        </Button>
      }
    >
    </HeaderLayout>
    <ContentLayout>
      {isLoading ? (
        <LoadingIndicatorPage />
      ) : (
        <Layout>
          <Box padding={8} background="primary100">
            <TabGroup label="Some stuff for the label" id="tabs" onTabChange={selected => console.log(selected)}>
              <Tabs>
                <Tab>Content Manager</Tab>
                <Tab>Developer</Tab>
                <Tab>Not display</Tab>
              </Tabs>
              <TabPanels>
                <TabPanel>
                  <Box padding={4} background="neutral0">
                    <Table colCount={COL_COUNT} rowCount={ROW_COUNT} footer={<TFooter icon={<Plus />}>Add another field to this collection type</TFooter>}>
                      <Thead>
                        <Tr>
                          <Th>
                            <BaseCheckbox aria-label="Select all entries" />
                          </Th>
                          <Th>
                            <Typography variant="sigma">ID</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Cover</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Description</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Categories</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Contact</Typography>
                          </Th>
                          <Th>
                            <VisuallyHidden>Actions</VisuallyHidden>
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {entries.map(entry => <Tr key={entry.id}>
                          <Td>
                            <BaseCheckbox aria-label={`Select ${entry.contact}`} />
                          </Td>
                          <Td>
                            <Typography textColor="neutral800">{entry.id}</Typography>
                          </Td>
                          <Td>
                            <Avatar src={entry.cover} alt={entry.contact} />
                          </Td>
                          <Td>
                            <Typography textColor="neutral800">{entry.description}</Typography>
                          </Td>
                          <Td>
                            <Typography textColor="neutral800">{entry.category}</Typography>
                          </Td>
                          <Td>
                            <Typography textColor="neutral800">{entry.contact}</Typography>
                          </Td>
                          <Td>
                            <Flex>
                              <IconButton onClick={() => console.log('edit')} label="Edit" noBorder icon={<Pencil />} />
                              <Box paddingLeft={1}>
                                <IconButton onClick={() => console.log('delete')} label="Delete" noBorder icon={<Trash />} />
                              </Box>
                            </Flex>
                          </Td>
                        </Tr>)}
                      </Tbody>
                    </Table>
                  </Box>
                </TabPanel>
                <TabPanel>
                  <Box padding={4} background="neutral0">
                    Second panel
                  </Box>
                </TabPanel>
                <TabPanel>
                  <Box padding={4} background="neutral0">
                    Third panel
                  </Box>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </Box>




        </Layout>
      )}
    </ContentLayout>
  </Main>





};

export default memo(HomePage);
