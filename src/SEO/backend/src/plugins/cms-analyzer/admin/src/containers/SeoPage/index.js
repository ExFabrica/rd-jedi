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
//Custom
import { Button } from '@strapi/design-system/Button';
import { IconButton } from '@strapi/design-system/IconButton';
import { Loader } from '@strapi/design-system/Loader';
import Play from '@strapi/icons/Play';
import Cog from '@strapi/icons/Cog';
import Pencil from '@strapi/icons/Pencil';
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import { Typography } from '@strapi/design-system/Typography';
import { LinkButton } from '@strapi/design-system/LinkButton';
import { Badge } from '@strapi/design-system/Badge';
import { Box } from '@strapi/design-system/Box';
import { Grid } from '@strapi/design-system/Grid';

//Layout
import { ContentLayout, HeaderLayout, Layout } from '@strapi/design-system/Layout';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import { Main } from '@strapi/design-system/Main';
//ACCORDION
import { AccordionGroup } from '@strapi/design-system/Accordion';
//Custom ACCORDION content
import { AnalyseAccordion } from './components/analyse-accordion';
import pluginId from '../../pluginId';

import { getSeoWarningLevelColor,getSeoErrorLevelColor, getBadgeTextColor }from '../../utils/getSeoColor.js';


const SeoPage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState();
  const [analysisProgress, setAnalysisProgress] = useState();
  const [toggleState, setToggleState] = useState({});
  const toggleNotification = useNotification();

  const { push } = useHistory();
  const low_color = getSeoWarningLevelColor();
  const high_color = getSeoErrorLevelColor();

  useEffect(async () => {
    setIsLoading(true);
    await refreshAllData()
    setSettings(await settingsAPI.get());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // If an analysis is pending, refresh the state until the analysis ends
    let refreshInterval
    if (isAnalysisRunning) {
      refreshInterval = setInterval(async () => {
        const analysisState = await contentAnalyzerAPI.analysisState()
        setAnalysisProgress({ current: analysisState.analyzed, total: analysisState.total })
        if (!analysisState.isRunning) {
          await refreshAllData();
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
      }, 3000);
    }
    
    return () => {
      if(refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };
  }, [isAnalysisRunning]);

  /**
   * Refresh all the data of the page
   * @returns true if an analysis is running, false otherwise
   */
  const refreshAllData = async () => {
    try {
      const analysisState = await contentAnalyzerAPI.analysisState();
      setIsAnalysisRunning(analysisState.isRunning);
      setAnalysisProgress({ current: analysisState.analyzed, total: analysisState.total })

      if (!analysisState.isRunning) {
        const analyses = await contentAnalyzerAPI.getSortedAnalyses();
        console.log("Retrieved analyses:", analyses);
        setResults(analyses);
        initToggleState(analyses);
      }
    }
    catch (err) {
      console.log("HomePage mount error: ", err);
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
    try {
      /* # 5193 - force enabled primary front url - BEGIN */
      // const payload = [
      //   settings.seo.frontEnabled ? settings.seo.frontUrl : "",
      //   settings.seo.frontEnabled2 ? settings.seo.frontUrl2 : "",
      //   settings.seo.frontEnabled3 ? settings.seo.frontUrl3 : ""
      // ].filter(item => item);

      const urls = [
        settings.seo.frontUrl,
      ].filter(item => item);
      /* # 5193 - END */

      if (urls.length > 0) {
        setIsAnalysisRunning(true)
        setAnalysisProgress(null)
        await contentAnalyzerAPI.run({
          urls: urls,
          navigationTimeout: settings.seo.navigationTimeout * 1000, // Seconds to millis
          clickToFind: settings.seo.clickToFind !== false, // Null is true
        })
      } else {
        throw "No front end URL to crawl. Check in settings if an URL is set.";
      }
    } catch (err) {
      if (toggleNotification === undefined) return;
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
            <Typography variant="sigma">{ formatMessage({id: getTrad("plugin.seo.table.rank")}) }</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">{ formatMessage({id: getTrad("plugin.seo.table.url")}) }</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">{ formatMessage({id: getTrad("plugin.seo.table.errors")}) }</Typography>
          </Th>
          <Th>
            <Typography variant="sigma">{ formatMessage({id: getTrad("plugin.seo.table.edit")}) }</Typography>
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
              <Grid gridCols={2}>
                <Box>
                  { high?.length ? 
                  <Badge backgroundColor={high_color} textColor={getBadgeTextColor(high_color)} padding={2}>{'High: ' + high?.length ?? 0}</Badge>
                  :<></>}
                </Box>

                <Box>
                  { low?.length ? 
                  <Badge backgroundColor={low_color} textColor={getBadgeTextColor(low_color)} padding={2}>{'Low: ' + low?.length ?? 0}</Badge>
                  :<></>}
                </Box>
              </Grid>
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
      title={ formatMessage({id: getTrad("plugin.seo.title")}) }
      subtitle={ formatMessage({id: getTrad("plugin.seo.subtitle")}) }
      primaryAction={
        <Button onClick={handleSubmit} startIcon={<Play />} size="L" disabled={isLoading || isAnalysisRunning} loading={isAnalysisRunning}>
          { formatMessage({id: getTrad(isAnalysisRunning ? "plugin.seo.analysisPending" : "plugin.seo.runAnalysis")})}
        </Button>
      }
      secondaryAction={
        <Button variant="tertiary" onClick={configure} startIcon={<Cog />}>
          { formatMessage({id: getTrad("plugin.seo.settings")}) }
        </Button>
      }
    >
    </HeaderLayout>
    <ContentLayout>
      {isLoading || isAnalysisRunning ? (
        <EmptyStateLayout icon={
          <Loader>{formatMessage({ id: getTrad("plugin.seo.loading") })}</Loader>
        } content={
          isAnalysisRunning
            ? formatMessage({ id: getTrad("plugin.seo.runningAnalysisProgress") }, analysisProgress ?? { current: 0, total: 0 })
            : ''
        } />
      ) : (
        displayContent()
      )}
    </ContentLayout>
  </Main>
};

export default memo(SeoPage);
