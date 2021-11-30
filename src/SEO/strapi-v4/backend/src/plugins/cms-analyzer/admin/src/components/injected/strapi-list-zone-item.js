import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { StrapiAnalyzerPanel } from './strapi-analyzer-panel';
import { StrapiUIRefresher } from './strapi-ui-refresher'

import Globe from '@strapi/icons/Globe';
import { LinkButton } from '@strapi/design-system/LinkButton';

export const StrapiListZoneItem = () => {
  const [showPanel, setShowPanel] = useState(false);

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  //TODO check if the strapi object is the analyzed list.
  return (
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
    </>
  );
};