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
import {
  FormBloc,
  BaselineAlignment,
} from '@strapi/helper-plugin';
import { Button } from '@buffetjs/core';
import { Header } from '@buffetjs/custom';
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

import GenericGrid from './components/genericGrid';

const HomePage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [results, setResults] = useState();
  const [showLoader, setShowLoader] = useState();

  useEffect(() => {
    console.log("getAnalyses component mount");
    try {
      /*contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
        console.log("getAnalyses analyses ", analyses);
        setResults(analyses);
      }, (err) => {
        console.log(err);
      });*/
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
    setShowLoader(true);
    try {
      contentAnalyzerMiddleware.runConsolidation(settings.frontUrl).then((result) => {
        console.log("runConsolidation result ", result);
        if (result.success) {
          contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
            console.log("runConsolidation getAnalyses analyses ", analyses);
            setResults(analyses);
            setShowLoader(false);
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
    <div style={{ paddingTop: "20px" }}>
      <div className="container-fluid row">
        <div className="col-6">
          <Header
            title={{ label: formatMessage({ id: getTrad("plugin.homepage.title") }) }}
            content={formatMessage({ id: getTrad("plugin.settings.subtitle") })}
            isLoading={showLoader}
          />
        </div>
        <div className="col-6" style={{ textAlign: 'right' }}>
          <Button color="primary" onClick={handleSubmit} icon={<FontAwesomeIcon icon={faClock} />} label={"Run Analyzer"} />
        </div>
      </div>

      {
        results ?
          <>
            <div style={{ paddingRight: "30px", paddingLeft: "30px" }}>
              {results.map((item) => {
                const apiNames = JSON.parse(item.apiNames);
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
                          let seoAnalyse = JSON.parse(item.seoAnalyse);
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
                          let seoAnalyse = JSON.parse(item.seoAnalyse);
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
            </div>
          </>
          : <></>
      }

      <div
        title={"Analyzer settings in your current STRAPI application:"}>
        {settings ?
          <ul>
            <li key="1">{formatMessage({ id: getTrad("plugin.settings.panel.setting1.label") })}: {settings.frontUrl}</li>
            <li key="2">{formatMessage({ id: getTrad("plugin.settings.panel.setting2.label") })}: {settings.enabled ? "true" : "false"}</li>
          </ul> : <></>}
      </div>
    </div>
  );
};

export default memo(HomePage);
