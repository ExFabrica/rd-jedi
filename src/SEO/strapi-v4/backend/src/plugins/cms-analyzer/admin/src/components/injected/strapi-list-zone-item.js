import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { StrapiAnalyzerPanel } from './strapi-analyzer-panel';
import { StrapiUIRefresher } from './strapi-ui-refresher'

const ComponentStyleA = styled.a`
  display: block;
  color: #333740;
  width: 100%;
  text-decoration: none;
  span,
  i,
  svg {
    color: #333740;
    width: 13px;
    height: 12px;
    margin-right: 10px;
    vertical-align: 0;
  }
  span {
    font-size: 13px;
  }
  i {
    display: inline-block;
    background-image: url("");
    background-size: contain;
  }
  &:hover {
    text-decoration: none;
    span,
    i,
    svg {
      color: #007eff;
    }
  }
`;

export const StrapiListZoneItem = () => {
    const [showPanel, setShowPanel] = useState(false);

    const togglePanel = () => {
        setShowPanel(!showPanel);
    };

    return (
        <>
            {ReactDOM.createPortal(<StrapiAnalyzerPanel show={showPanel} />, document.getElementById("app"))}
            <li>
                <ComponentStyleA
                    onClick={() => {
                        togglePanel();
                    }}
                >
                    <i />
                    <span>Show results from CMS ANALYZER</span>
                </ComponentStyleA>

                <StrapiUIRefresher />
            </li>
        </>
    );
};