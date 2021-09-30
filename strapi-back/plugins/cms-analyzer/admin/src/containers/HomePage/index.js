/*
 *
 * HomePage
 *
 */
import React, { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import getTrad from '../../utils/getTrad';
import contentAnalizerMiddleware from '../../middlewares/analyzer/ui-contentAnalyzer';
import contentTypesMiddleware from '../../middlewares/content-types/ui-contentTypes';
import settingsMiddleware from '../../middlewares/settings/ui-settings';
import {
  FormBloc,
  BaselineAlignment,
} from 'strapi-helper-plugin';

import ModalAdd from './components/modal';
import GenericGrid from './components/genericGrid';

const HomePage = (props) => {
  const { formatMessage } = useIntl();
  const [settings, setSettings] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [injectModal, setInjectModal] = useState(false);
  const [injectModalParams, setInjectModalParams] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [results, setResults] = useState();

  useEffect(() => {
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

  const getAnalyzerDataSource = async () => {
    const rs = await contentAnalizerMiddleware.get();
    setResults(rs[0].results);
    setShowGrid(true);
    return Promise.resolve(rs);
  }

  const getMessageDataSource = async () => {
    return Promise.resolve(results);
  }

  const getContentTypesDataSource = async () => {
    return Promise.resolve(await contentTypesMiddleware.get());
  }

  return (
    <div className="container-fluid" style={{ paddingTop: "20px" }}>
      {injectModal ?
        <ModalAdd params={injectModalParams} isOpen={isOpen} onOpened={handleOpen} onClosed={handleClosed} onToggle={handleClosed} />
        : <></>
      }
      <h2 style={{ marginBottom: "20px" }}>{formatMessage({ id: getTrad("plugin.homepage.title") })}</h2>
      <h3 style={{ marginBottom: "20px" }}>ContentTypes available in your current STRAPI application:</h3>

      <GenericGrid datasource={getAnalyzerDataSource} headers={[{
        name: 'Url',
        value: 'url',
        isSortEnabled: true,
      }]} />
      <br />

      {showGrid ?
        <GenericGrid datasource={getMessageDataSource} headers={[{
          name: 'Message',
          value: 'message',
          isSortEnabled: true,
        }]} /> : <></>}
      <br />

      <GenericGrid datasource={getContentTypesDataSource} headers={[
        {
          name: 'Id',
          value: 'uid',
          isSortEnabled: true,
        },
        {
          name: 'Name',
          value: 'collectionName',
          isSortEnabled: true,
        },
        {
          name: 'Kind',
          value: 'kind',
          isSortEnabled: true,
        },
        {
          name: 'Created By',
          value: 'createdBy',
          isSortEnabled: true,
        },
        {
          name: 'ModelName',
          value: 'modelName',
          isSortEnabled: true,
        },
      ]} />

      <BaselineAlignment top size="12px" />

      <FormBloc
        title={"Exfabrica Analizer settings in your current STRAPI application:"}>
        {settings ?
          <ul>
            <li key="1">{formatMessage({ id: getTrad("plugin.settings.panel.setting1.label") })}: {settings.setting1}</li>
            <li key="2">{formatMessage({ id: getTrad("plugin.settings.panel.setting2.label") })}: {settings.setting2 ? "true" : "false"}</li>
            <li key="3">{formatMessage({ id: getTrad("plugin.settings.panel.setting3.label") })}: {settings.setting3}</li>
          </ul> : <></>}
      </FormBloc>
    </div>
  );
};

export default memo(HomePage);