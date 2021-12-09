import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { StrapiAnalyzerPanel } from './strapi-analyzer-panel';
import { StrapiUIRefresher } from './strapi-ui-refresher'

import Globe from '@strapi/icons/Globe';
import { LinkButton } from '@strapi/design-system/LinkButton';
const _ = require('lodash');
import { useCMEditViewDataManager, request } from '@strapi/helper-plugin';

export const StrapiListZoneItem = () => {
  const [showPanel, setShowPanel] = useState(false);
  const { slug } = useCMEditViewDataManager();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    request('/cms-analyzer/matches', {
      method: 'GET'
    }).then(result => {
      const slugs = _.groupBy(result, "apiName");
      if(slugs)
        setIsVisible(Object.getOwnPropertyNames(slugs).includes(slug));
    });
  }, []);

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    isVisible ?
    <>
      {/*inject the html refresher*/}
      {ReactDOM.createPortal(<StrapiUIRefresher />, document.getElementById("app"))}
      {/*inject the assisant panel into page*/}
      {ReactDOM.createPortal(<StrapiAnalyzerPanel show={showPanel} />, document.getElementById("app"))}
      {/*TODO Add permission*/}
      <LinkButton
        onClick={() => {
          togglePanel();
        }}
        size="S"
        startIcon={<Globe />}
        style={{ width: '100%' }}
        variant="secondary"
        to="#"
      >
        {"Analyzer tips"}
      </LinkButton>

    </> : <></>
  );
};