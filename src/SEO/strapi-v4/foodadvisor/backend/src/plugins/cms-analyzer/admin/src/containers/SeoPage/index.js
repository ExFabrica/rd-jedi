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
import { IconButton } from '@strapi/design-system/IconButton';
import Plus from '@strapi/icons/Plus';
import Cog from '@strapi/icons/Cog';
import Pencil from '@strapi/icons/Pencil';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import { Typography } from '@strapi/design-system/Typography';
import { LinkButton } from '@strapi/design-system/LinkButton';
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

  const { push } = useHistory();

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
    push(`/settings/${pluginId}/seo`);
    /* #5181 - END */
  }

  

  /** #5178 - introduce "expert mode". 
   * When expert mode is enable, accordion view with detail per page is displayed.
   * otherwise a simple list view with only few information( rank, url..) is displayed.
   * */
  /** display expert mode content*/
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

  /** display simple mode content*/
  const simplePage = () => {
    const COL_COUNT = 5;
    return <Table colCount={COL_COUNT} rowCount={results.length}>
      <Thead>
        <Tr>
          <Th>
            <Typography variant="sigma">Rank</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">URL</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">api</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">id</Typography>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {results.map((analyse, index) => {
          return <Tr key={`contentpage-${index}`}>
            <Td>
              <Typography textColor="neutral800">{analyse.depth}</Typography>
            </Td>
            <Td>
              <Typography textColor="neutral800">{analyse.frontUrl}</Typography>
            </Td>
            <Td>
              <Typography textColor="neutral800">{analyse.apiName}/{analyse.documentId}</Typography>
            </Td>
            <Td>
              
            </Td>
          </Tr>
        })}
      </Tbody>
    </Table>
  };

  /** display content according expertMode setting */
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
