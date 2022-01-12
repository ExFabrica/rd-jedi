/*
 *
 * HomePage
 *
 */
import React, { memo, useEffect, useState } from 'react';
import { useHistory } from "react-router-dom";

//I18n
import { useIntl } from 'react-intl';
import getTrad from '../../utils/getTrad';
//API Wrapper
import settingsAPI from '../../api/settings/settings-api-wrapper';
import contentAnalyzerAPI from '../../api/seo/seo-api-wrapper';
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
import pluginId from '../../pluginId';


const SeoPage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState();
  const [toggleState, setToggleState] = useState({});
  const toggleNotification = useNotification();

  const history = useHistory();

  useEffect(() => {
    try {
      contentAnalyzerAPI.getSortedAnalyses().then((analyses) => {
        console.log("Retrieved analyses:", analyses);
        setResults(analyses);
        initToggleState(analyses);
      }, (err) => {
        console.log(err);
      });
      settingsAPI.get().then(settings => {
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
    setIsLoading(true);
    try {
      /* # 5193 - force enabled primary front url - BEGIN */
      // const payload = [
      //   settings.seo.frontEnabled ? settings.seo.frontUrl : "",
      //   settings.seo.frontEnabled2 ? settings.seo.frontUrl2 : "",
      //   settings.seo.frontEnabled3 ? settings.seo.frontUrl3 : ""
      // ].filter(item => item);

      const payload = [
        settings.seo.frontUrl,
      ].filter(item => item);
      /* # 5193 - END */

      if (payload.length > 0)
        contentAnalyzerAPI.run(payload).then((result) => {
          console.log("run result ", result);
          if (result.success) {
            contentAnalyzerAPI.getAnalyses().then((analyses) => {
              console.log("run getAnalyses analyses ", analyses);
              setResults(analyses);
              setIsLoading(false);
            });
          }
        }, (err) => {
          console.log(err);
        });
      else {
        throw "No front end URL to crawl. Check in settings if an URL is set.";
      }
    } catch (err) {
      setIsLoading(false);
      toggleNotification({
        type: 'warning',
        message: err,
      });
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
    /* #5181 - navigate to seo plugin's settings page - BEGIN */
    let path = `/settings/${pluginId}/seo`; 
    history.push(path);
    /* #5181 - END */
  }

  const expertPage= ()=>{
    return <Layout>
    <AccordionGroup>
      {results.map((analyse, index) => {
        const id = `acc-${index}`;
        return <AnalyseAccordion toggleState={toggleState} key={`contentpage-${index}`} id={id} value={analyse} onToggle={toggle}></AnalyseAccordion>
      })}
    </AccordionGroup>
  </Layout>
  };

  const simplePage=()=>
  {
    return <>/!\Work in progress/!\</>;
  };

  const displayContent=()=>{
    return settings!=undefined?(settings.seo.expertMode?expertPage():simplePage()):<></>;
  }

  return <Main labelledBy="title" aria-busy={isLoading}>
    <HeaderLayout
      id="title"
      title={"SEO Analyzer"}
      subtitle={"From the frontend to your STRAPI!"}
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
      ) : (displayContent()
      )}
    </ContentLayout>
  </Main>
};

export default memo(SeoPage);
