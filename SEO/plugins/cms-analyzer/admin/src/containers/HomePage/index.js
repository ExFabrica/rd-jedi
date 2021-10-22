/*
 *
 * HomePage
 *
 */
import React, { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../utils/getTrad';
import contentTypesMiddleware from '../../middlewares/content-types/ui-contentTypes';
import settingsMiddleware from '../../middlewares/settings/ui-settings';
import contentAnalyzerMiddleware from '../../middlewares/analyzer/ui-contentAnalyzer';
import {
  FormBloc,
  BaselineAlignment,
} from 'strapi-helper-plugin';
import { Button, Toggle, InputNumber, InputText, Label } from '@buffetjs/core';
import { Header } from '@buffetjs/custom';
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

import GenericGrid from './components/genericGrid';

const HomePage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [injectModal, setInjectModal] = useState(false);
  const [injectModalParams, setInjectModalParams] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [results, setResults] = useState();
  const [showLoader, setShowLoader] = useState();

  useEffect(() => {
    contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
      console.log("analyses", analyses);
      setResults(analyses);
    });
    settingsMiddleware.get().then(settings => {
      console.log("settings", settings);
      setSettings(settings);
    })
  }, []);

  const handleOpen = () => {
    console.log("Table open");
  }

  const handleClosed = () => {
    setIsOpen(false);
    setInjectModal(false);
  }

  const getAnalyses = async () => {
    const analyses = await contentAnalyzerMiddleware.getAnalyses();
    setResults(analyses);
  }

  /*const getSeoDataSource = async () => {
    return Promise.resolve(rs.);
  }*/

  const getMessageDataSource = async () => {
    return Promise.resolve(results);
  }

  const getContentTypesDataSource = async () => {
    return Promise.resolve(await contentTypesMiddleware.get());
  }

  const handleSubmit = async () => {
    setShowLoader(true);
    await contentAnalyzerMiddleware.runConsolidation("http://localhost:3000");
    const analyses = await contentAnalyzerMiddleware.getAnalyses();
    setResults(analyses);
    setShowLoader(false);
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
            <div style={{ paddingRight:"30px", paddingLeft:"30px" }}>
              {results.map((item) => {
                return <div style={{ marginTop: "20px", padding: "30px", "border": "1px solid gray", "backgroundColor": "#f5f5f5" }} key={item.uid}>
                  <div style={{ "display": "flex" }}>
                    <div style={{ "flex": "1" }}>
                      <h1>{item.frontUrl}</h1>
                      <Link to={`/plugins/content-manager/collectionType/application::${item.apiNames[0]}.${item.apiNames[0]}/${item.documentId}`}>Link to Strapi Document</Link>
                      <br /><a target="_blank" href={item.frontUrl}>Link to Front</a>
                    </div>
                  </div>
                  <div style={{ "display": "flex" }}>
                    <div style={{ "flex": "1", "margin": "auto" }}>
                      <img width="98%" src={item.screenshot} alt={item.url} />
                    </div>
                    <div style={{ "flex": "1", "paddingTop": "30px" }}>
                      <h2>SEO</h2>
                      <br />
                      <GenericGrid headers={
                        [
                          {
                            name: 'Message',
                            value: 'message',
                            isSortEnabled: true,
                          }]}
                        datasource={() => {
                          let seoAnalyse = JSON.parse(item.seoAnalyse);
                          if (seoAnalyse)
                            seoAnalyse = seoAnalyse.map(item => {
                              return {
                                message: item.message.length > 90 ? item.message.substring(0, 90) + "..." : item.message
                              }
                            });
                          return Promise.resolve(seoAnalyse);
                        }} ></GenericGrid>
                    </div>
                    {/*<div style={{ "flex": "1" }}>
                    <GenericGrid headers={
                      [
                        {
                          name: 'Key',
                          value: 'key',
                          isSortEnabled: true,
                        },
                        {
                          name: 'Value',
                          value: 'value',
                          isSortEnabled: true,
                        }]}
                      datasource={() => {
                        const documentFields = JSON.parse(item.documentFields);
                        return Promise.resolve(documentFields);
                      }}></GenericGrid>
                    </div>*/}
                  </div>
                </div>
              })}
            </div>
          </>
          : <></>
      }

      <BaselineAlignment top size="12px" />

      <FormBloc
        title={"Analyzer settings in your current STRAPI application:"}>
        {settings ?
          <ul>
            <li key="1">{formatMessage({ id: getTrad("plugin.settings.panel.setting1.label") })}: {settings.frontUrl}</li>
            <li key="2">{formatMessage({ id: getTrad("plugin.settings.panel.setting2.label") })}: {settings.enabled ? "true" : "false"}</li>
          </ul> : <></>}
      </FormBloc>
    </div>
  );
};

export default memo(HomePage);
