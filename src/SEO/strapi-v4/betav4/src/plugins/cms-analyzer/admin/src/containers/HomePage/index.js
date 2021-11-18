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
import { H2, H3,Text } from '@strapi/design-system/Text';
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


const HomePage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState();
  const [isLoading, setIsLoading] = useState();

  useEffect(() => {
    console.log("getAnalyses component mount");
    try {
      contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
        console.log("getAnalyses analyses ", analyses);
        setResults(analyses);
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

  return (
    <Main labelledBy="title" aria-busy={isLoading}>
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
            <Stack size={2}>
              {
                results ?
                  <>
                    <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                      {results.map((item) => {
                        const apiNames = item.apiNames;
                        return <div style={{ marginTop: "20px", padding: "30px", "border": "1px solid gray", "backgroundColor": "#f5f5f5" }} key={item.uid}>
                          <div style={{ "display": "flex" }}>
                            <div style={{ "flex": "1" }}>
                              <h1>{item.frontUrl}</h1>
                              <Link to={`/plugins/content-manager/collectionType/application::${apiNames[0]}.${apiNames[0]}/${item.documentId}`}>Link to Strapi Document</Link>
                              <br /><a target="_blank" href={item.frontUrl}>Link to Front</a>
                            </div>
                          </div>
                          <div style={{ "display": "flex" }}>
                            <div style={{ "flex": "1", "margin": "auto" }}>
                              <img width="98%" src={item.screenshot} alt={item.url} />
                            </div>
                            <div style={{ "flex": "1", "paddingTop": "30px" }}>
                              <h2>SEO rules to check</h2>
                              <br />
                              <h3>For Content Manager:</h3>
                              <br />
                              <GenericGrid headers={
                                [
                                  {
                                    name: 'Message',
                                    value: 'message',
                                    isSortEnabled: true,
                                  },
                                  {
                                    name: 'Level',
                                    value: 'level',
                                    isSortEnabled: true,
                                  }
                                ]}
                                datasource={() => {
                                  let seoAnalyse = item.seoAnalyse;
                                  if (seoAnalyse)
                                    seoAnalyse = seoAnalyse.filter(item => item.target === 0 || item.target === 2).map(item => {
                                      return {
                                        message: item.message.length > 90 ? item.message.substring(0, 90) + "..." : item.message,
                                        level: item.level
                                      }
                                    });
                                  return Promise.resolve(seoAnalyse);
                                }} ></GenericGrid>
                              <br />
                              <h3>For Developer:</h3>
                              <br />
                              <GenericGrid headers={
                                [
                                  {
                                    name: 'Message',
                                    value: 'message',
                                    isSortEnabled: true,
                                  },
                                  {
                                    name: 'Level',
                                    value: 'level',
                                    isSortEnabled: true,
                                  }]}
                                datasource={() => {
                                  let seoAnalyse = item.seoAnalyse;
                                  if (seoAnalyse)
                                    seoAnalyse = seoAnalyse.filter(item => item.target === 1 || item.target === 2).map(item => {
                                      return {
                                        message: item.message.length > 90 ? item.message.substring(0, 90) + "..." : item.message,
                                        level: item.level
                                      }
                                    });
                                  return Promise.resolve(seoAnalyse);
                                }} ></GenericGrid>
                            </div>
                          </div>
                        </div>
                      })}
                    </Box>
                  </>
                  : <></>
              }

              <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                <Stack size={2}>
                  <Flex>
                    <H2>
                      {"Analyzer settings in your current STRAPI application"}
                    </H2>
                  </Flex>
                  {settings ?
                    <Grid gap={6}>
                      <GridItem col={6} s={12}>
                        <Stack size={2}>
                          <H3>Front to analyze</H3>
                          <Text>{settings.frontUrl}</Text>
                        </Stack>
                      </GridItem>
                      <GridItem col={6} s={12}>
                        <Stack size={2}>
                          <H3>Enabled</H3>
                          <Text>{settings.enabled}</Text>
                        </Stack>
                      </GridItem>
                    </Grid>
                    : <></>
                  }
                </Stack>
              </Box>
            </Stack>
          </Layout>
        )}
      </ContentLayout>
    </Main>
  );
};

export default memo(HomePage);
