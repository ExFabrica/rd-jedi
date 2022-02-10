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
  useNotification,
} from '@strapi/helper-plugin';
import { AbortController } from 'native-abort-controller';
//Custom
import { Button } from '@strapi/design-system/Button';
import { IconButton } from '@strapi/design-system/IconButton';
import { Loader } from '@strapi/design-system/Loader';
import Plus from '@strapi/icons/Plus';
import Cog from '@strapi/icons/Cog';
import Pencil from '@strapi/icons/Pencil';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import { Typography } from '@strapi/design-system/Typography';
import { LinkButton } from '@strapi/design-system/LinkButton';
import { Badge } from '@strapi/design-system/Badge';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';

//Layout
import { ContentLayout, HeaderLayout, Layout } from '@strapi/design-system/Layout';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import { Main } from '@strapi/design-system/Main';
//ACCORDION
import { AccordionGroup } from '@strapi/design-system/Accordion';
//Custom ACCORDION content
import { AnalyseAccordion } from './components/analyse-accordion';
import pluginId from '../../pluginId';

import {getSeoWarningLevelColor,getSeoErrorLevelColor, getBadgeTextColor  }from '../../utils/getSeoColor.js';


const SeoPage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState();
  const [abortController, setAbortController] = useState();
  const [toggleState, setToggleState] = useState({});
  const toggleNotification = useNotification();

  const { push } = useHistory();
  const low_color = getSeoWarningLevelColor();
  const high_color = getSeoErrorLevelColor();

  useEffect(() => {
    // If an analysis is pending, refresh the state until the analysis ends
    let refreshInterval
    refreshAllData().then(async analysisRunning => {
      if (analysisRunning) {
        refreshInterval = setInterval(async () => {
          const stillRunning = await contentAnalyzerAPI.isRunning()
          if (!stillRunning) {
            await refreshAllData();
            clearInterval(refreshInterval);
            refreshInterval = null;
          }
        }, 3000);
      }
    });
    
    return () => {
      if(refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };
  }, []);

  // The analysis can be very long and should not be waited when we exit the page
  // For this behaviour, we send a cancel signal to the AbortController when the component is destroyed
  useEffect(() => {
    const currentAbortController = abortController
    
    return () => {
      if (currentAbortController) {
        currentAbortController.abort();
      }
    }
  }, [abortController])

  /**
   * Refresh all the data of the page
   * @returns true if an analysis is running, false otherwise
   */
  const refreshAllData = async () => {
    try {
      setIsLoading(true);

      const analysisRunning = await contentAnalyzerAPI.isRunning();
      setIsAnalysisRunning(analysisRunning);

      if (!analysisRunning) {
        const analyses = await contentAnalyzerAPI.getSortedAnalyses();
        console.log("Retrieved analyses:", analyses);
        setResults(analyses);
        initToggleState(analyses);
      }
      
      setSettings(await settingsAPI.get());

      setIsLoading(false);
      return analysisRunning
    }
    catch (err) {
      console.log("HomePage mount error: ", err);
      return false;
    }
  }

  const initToggleState = (analyses) => {
    let toggleState = {};
    for (let i = 0 ; i < analyses.length ; ++i) {
      toggleState[`acc-${i}`] = i === 0;
    }
    setToggleState(toggleState);
  }

  const handleSubmit = async () => {
    setIsAnalysisRunning(true);

    // The "run" operation can be very long and should not be waited when we exit the page
    // For this behaviour, we create an AbortController to cancel the request on page exit
    // The HTTP request will be canceled but the server will continue to run the analysis.
    const controller = new AbortController();
    setAbortController(controller);

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

      if (payload.length > 0) {
        const result = await contentAnalyzerAPI.run(payload, controller.signal)
        console.log("run result ", result);
        if (result.success) {
          const analyses = await contentAnalyzerAPI.getAnalyses()
          console.log("run getAnalyses analyses ", analyses);
          setResults(analyses);
          initToggleState(analyses);
        }
      } else {
        throw "No front end URL to crawl. Check in settings if an URL is set.";
      }
    } catch (err) {
      // If the error comes from a cancelation of request, ignore it
      if (controller.signal.aborted) return;
      if(toggleNotification ===undefined) return;
      toggleNotification({
        type: 'warning',
        message: err,
      });
    } finally {
      if (controller.signal.aborted) return;
      setIsAnalysisRunning(false);
      setAbortController(null);
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

  /**  #5175 - redirect to url to edit  - BEGIN */
  const handleEdit= async (id, contentKind, apiName, documentId,locale) =>{
    await contentAnalyzerAPI.setAnalyzeAsChecked(id)
    push(`/content-manager/${contentKind}/${apiName}/${documentId}?plugins[i18n][locale]=${locale}`)
  }
  /* #5175 -END */

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
            <Typography variant="sigma"></Typography>
          </Th>
          <Th>
            <Typography variant="sigma"></Typography>
          </Th>
          <Th>
            <Typography variant="sigma">Edit</Typography>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {results.map((analyse, index) => {
          const analyses = JSON.parse(analyse.seoAnalyse);
          const low = analyses.filter(item =>(item.target === 0 || item.target === 2)&& item.level=="warnings");
          const high = analyses.filter(item =>(item.target === 0 || item.target === 2)&& item.level=="errors");
          return <Tr key={`contentpage-${index}`}>
            <Td>
              <Typography textColor="neutral800" fontWeight={analyse.isChecked ? 'inherited' : 'bold'}>{analyse.depth}</Typography>
            </Td>
            <Td>
              <Typography textColor="neutral800" fontWeight={analyse.isChecked ? 'inherited' : 'bold'}>{analyse.frontUrl}</Typography>
            </Td>
            <Td>
              <Flex>
                { high?.length ? 
                <Badge backgroundColor={high_color} textColor={getBadgeTextColor(high_color)} paddingLeft="2" paddingRight="2" paddingTop="2" paddingBottom="2"> {'High: ' + high?.length ?? 0}</Badge>
                :<></>}
                
              </Flex>
            </Td>
            <Td>
              <Flex>
                
                { low?.length ? 
                <Badge backgroundColor={low_color} textColor={getBadgeTextColor(low_color)} paddingLeft="2" paddingRight="2" paddingTop="2" paddingBottom="2" > {'Low: ' + low?.length ?? 0}</Badge>
                :<></>}
              </Flex>
            </Td>
            <Td>
              {/* #5175 - add link edit page - BEGIN*/}
              <IconButton label='Edit' icon={<Pencil />} onClick={() => handleEdit(analyse.id, analyse.contentKind,analyse.apiName,analyse.documentId, analyse.locale)}/>
              {/* #5175 - END */}
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

  return <Main labelledBy="title" aria-busy={isLoading || isAnalysisRunning}>
    <HeaderLayout
      id="title"
      title={"SEO Analyzer"}
      subtitle={"From the frontend to your STRAPI!"}
      primaryAction={
        <Button onClick={handleSubmit} startIcon={<Plus />} size="L" disabled={isLoading || isAnalysisRunning} >
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
      {isLoading || isAnalysisRunning ? (
        <EmptyStateLayout icon={
          <Loader>{formatMessage({ id: getTrad("plugin.homepage.loading") })}</Loader>
        } content={
          isAnalysisRunning ? formatMessage({ id: getTrad("plugin.homepage.runningAnalysis") }) : ''
        } />
      ) : (
        displayContent()
      )}
    </ContentLayout>
  </Main>
};

export default memo(SeoPage);
