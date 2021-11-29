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

import { Stack } from '@strapi/design-system/Stack';
import { Main } from '@strapi/design-system/Main';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Button } from '@strapi/design-system/Button';
import Plus from '@strapi/icons/Plus';
import Pencil from '@strapi/icons/Pencil';
import User from '@strapi/icons/User';
import Trash from '@strapi/icons/Trash';
import { ContentLayout, HeaderLayout, Layout } from '@strapi/design-system/Layout';
import {
  CheckPagePermissions,
  LoadingIndicatorPage,
  useNotification,
} from '@strapi/helper-plugin';
import { ToggleInput } from '@strapi/design-system/ToggleInput';
//Content page grid
import { AnalysePage } from './components/analyse-page';
//ACCORDION

import { AccordionGroup, Accordion, AccordionToggle, AccordionContent } from '@strapi/design-system/Accordion';
import { KeyboardNavigable } from '@strapi/design-system/KeyboardNavigable';
import { IconButton } from '@strapi/design-system/IconButton';

const HomePage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState();
  const [toggleState, setToggleState] = useState({});

  useEffect(() => {
    console.log("getAnalyses component mount");
    try {
      contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
        console.log("getAnalyses analyses ", analyses);
        setResults(analyses);

        let index = 0;
        let toggleState = {};
        for (const analyse of analyses) {
          const id = `acc-${index}`;
          toggleState[id] = index === 0;
          index++;
        }
        setToggleState(toggleState);
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

  const toggle = (id) => {
    let state = { ...toggleState };
    for (const prop in state) {
      if (prop === id)
        state[prop] = !state[prop];
      else
        state[prop] = false;
    }
    setToggleState(state);
  }

  return <Main labelledBy="title" aria-busy={isLoading}>
    <HeaderLayout
      id="title"
      title={formatMessage({ id: getTrad("plugin.homepage.title") })}
      subtitle={formatMessage({ id: getTrad("plugin.homepage.subtitle") })}
      primaryAction={
        <Button onClick={handleSubmit} startIcon={<Plus />} size="L" >
          {"Run Analyzer"}
        </Button>
      }
      secondaryAction={
        <Button variant="tertiary" onClick={handleSubmit} startIcon={<Pencil />}>
          {"Settings"}
        </Button>
      }
    >
    </HeaderLayout>
    <ContentLayout>
      {isLoading ? (
        <LoadingIndicatorPage />
      ) : (
        <Layout>
          <AccordionGroup>
            {results.map((analyse, index) => {
              const id = `acc-${index}`;
              return (
                <Accordion key={id} expanded={toggleState[id]} toggle={() => toggle(id)} id={id}>
                  <AccordionToggle startIcon={<User aria-hidden={true} />} action={<Stack horizontal size={0}>
                    <IconButton noBorder onClick={() => console.log('edit')} label="Edit" icon={<Pencil />} />
                  </Stack>} title={analyse.frontUrl} togglePosition="left" />
                  <AccordionContent>
                    <Box padding={3}>
                      <AnalysePage key={`contentpage-${index}`} value={analyse}></AnalysePage>
                    </Box>
                  </AccordionContent>
                </Accordion>)
            })}
          </AccordionGroup>
        </Layout>
      )}
    </ContentLayout>
  </Main>
};

export default memo(HomePage);
