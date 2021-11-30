/*
 *
 * HomePage
 *
 */
import React, { memo, useEffect, useState } from 'react';
//I18n
import { useIntl } from 'react-intl';
import getTrad from '../../utils/getTrad';
//Middlewares
import settingsMiddleware from '../../middlewares/settings/ui-settings';
import contentAnalyzerMiddleware from '../../middlewares/analyzer/ui-contentAnalyzer';
//Some components
import {
  CheckPagePermissions,
  LoadingIndicatorPage,
  useNotification,
} from '@strapi/helper-plugin';
//Custom
import { Button } from '@strapi/design-system/Button';
import Plus from '@strapi/icons/Plus';
import Cog from '@strapi/icons/Cog';
//Layout
import { ContentLayout, HeaderLayout, Layout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
//ACCORDION
import { AccordionGroup } from '@strapi/design-system/Accordion';
//Custom ACCORDION content
import { AnalyseAccordion } from './components/analyse-accordion';

const HomePage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState();
  const [toggleState, setToggleState] = useState({});

  useEffect(() => {
    try {
      contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
        console.log("Retrieved analyses:", analyses);
        setResults(analyses);
        initToggleState(analyses);
      }, (err) => {
        console.log(err);
      });
      settingsMiddleware.get().then(settings => {
        setSettings(settings);
      });
    }
    catch (err) {
      console.log("HomePage mount error: ", err);
    }
  }, []);

  const initToggleState = (analyses) => {
    let index = 0;
    let toggleState = {};
    for (const analyse of analyses) {
      toggleState[`acc-${index}`] = index === 0;
      index++;
    }
    setToggleState(toggleState);
  }

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

  const configure = () => {
    console.log("settings to do");
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
        <Button variant="tertiary" onClick={configure} startIcon={<Cog />}>
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
              return <AnalyseAccordion toggleState={toggleState} key={`contentpage-${index}`} id={id} value={analyse} onToggle={toggle}></AnalyseAccordion>
            })}
          </AccordionGroup>
        </Layout>
      )}
    </ContentLayout>
  </Main>
};

export default memo(HomePage);
