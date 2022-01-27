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
import { Badge } from '@strapi/design-system/Badge';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';

//Layout
import { ContentLayout, HeaderLayout, Layout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
//ACCORDION
import { AccordionGroup } from '@strapi/design-system/Accordion';
//Custom ACCORDION content
import { AnalyseAccordion } from './components/analyse-accordion';
import pluginId from '../../pluginId';

import {getSeoWarningLevelColor,getSeoErrorLevelColor, getBadgeTextColor  }from '../../utils/getSeoErrorLevelColor';


const SeoPage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState();
  const [toggleState, setToggleState] = useState({});
  const toggleNotification = useNotification();

  const { push } = useHistory();
  const low_color = getSeoWarningLevelColor();
  const hight_color = getSeoErrorLevelColor();

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

  /**  #5175 - redirect to url to edit  - BEGIN */
  const handleEdit= (contentKind, apiName, documentId,locale) =>{
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
    const COL_COUNT = 4;
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
            <Typography variant="sigma">Errors</Typography>
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
              <Typography textColor="neutral800">{analyse.depth}</Typography>
            </Td>
            <Td>
              <Typography textColor="neutral800">{analyse.frontUrl}</Typography>
            </Td>
            <Td>
              <Flex>
                <Badge backgroundColor={hight_color} textColor={getBadgeTextColor(hight_color)} paddingLeft="2" paddingRight="2" paddingTop="2" paddingBottom="2"> {'High : ' + high?.length ?? 0}</Badge>
                <Box paddingLeft="5">
                  <Badge backgroundColor={low_color} textColor={getBadgeTextColor(low_color)} paddingLeft="2" paddingRight="2" paddingTop="2" paddingBottom="2" > {'Low : ' + low?.length ?? 0}</Badge>
                </Box>
              </Flex>
            </Td>
            <Td>
              {/* #5175 - add link edit page - BEGIN*/}
              <IconButton label='Edit' icon={<Pencil />} onClick={() => handleEdit(analyse.contentKind,analyse.apiName,analyse.documentId, analyse.locale)}/>
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
