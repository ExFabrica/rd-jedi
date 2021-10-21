import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useContentManagerEditViewDataManager, request } from 'strapi-helper-plugin';
import { Padded, Text } from '@buffetjs/core';
import EyeIcon from './view.svg';
const uuidv4 = require('uuid/v4');

const StyledAHelper = styled.a`
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
    background-image: url(${EyeIcon});
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

const StyledHelper = styled.div`
  position:fixed;
  bottom:20px;
  right:20px;
  width:380px;
  height:500px;
  overflow-x:hidden;
  overflow-y:auto;
  padding: 10px 10px 10px 10px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 2px 4px #e3e9f3;
  .warnings,
  .errors {
    padding:0px;
  }
  .errors li {
    list-style-type: none;
    counter-increment: item;
    padding:5px;
    font-size: 80%;
  }
  .errors li:before {
    content: counter(item);
    margin-right: 5px;
    font-size: 80%;
    color: white;
    font-weight: bold;
    padding: 3px 8px;
    border-radius: 3px;
  } 
  .errors li:before {
    background-color: red;
  } 
  .warnings li {
    list-style-type: none;
    counter-increment: item;
    padding:5px;    
    font-size: 80%;
  }
  .warnings li:before {
    content: counter(item);
    margin-right: 5px;
    font-size: 80%;
    color: white;
    font-weight: bold;
    padding: 3px 8px;
    border-radius: 3px;
  } 
  .warnings li:before {
    background-color: orange;
  } 
  h3 {
    margin-bottom:20px;
  }
  h4 {
    margin-top:20px;
    margin-bottom:20px;
  }
  figcaption {
    text-align:center;
  }
`;

const RefreshHtmlCode = () => {
  const context = useContentManagerEditViewDataManager();
  const [inputsCollection, setInputsCollection] = useState([]);
  const { modifiedData } = context;
  const [documentFields, setDocumentFields] = useState([]);

  const markHtml = () => {
    console.log("refresh red");
    for (const documentField of documentFields) {
      for (const inputItem of inputsCollection) {
        if (inputItem.style.borderWidth !== "red") {
          if (inputItem.value.toLowerCase() === documentField.value.toLowerCase()) {
            inputItem.style.borderWidth = "1px";
            inputItem.style.borderColor = "red";
            const label = document.querySelector("label[for='" + inputItem.id + "']");
            if (!label.innerHTML.includes("TAG")) {
              label.innerHTML = `${label.innerHTML} (front TAG: ${documentField.tagName})`
              label.style.color = "red";
            }
          }
        }
      }
    }
  }

  useEffect(() => {
    request(`/cms-analyzer/analyses/documents/${modifiedData.id}`, {
      method: 'GET'
    }).then(result => {
      setDocumentFields(JSON.parse(result.documentFields));
    });
  }, [modifiedData]);

  useEffect(() => {
    markHtml();
  }, [documentFields.length, inputsCollection.length]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      let inputsCollection = Array.from(document.getElementsByTagName("input"));
      inputsCollection = inputsCollection.concat(Array.from(document.getElementsByTagName("textarea")));
      setInputsCollection(inputsCollection);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return <></>;
}

const AnalysePanel = ({ show }) => {
  const context = useContentManagerEditViewDataManager();
  const { modifiedData, layout } = context;
  const [screenshot, setScreenshot] = useState();
  const [seoAnalyseErrors, setSeoAnalyzeErrors] = useState();
  const [seoAnalyseWarnings, setSeoAnalyzeWarnings] = useState();
  const [frontUrl, setFrontUrl] = useState();

  useEffect(() => {
    request(`/cms-analyzer/analyses/documents/${modifiedData.id}`, {
      method: 'GET'
    }).then(result => {
      if (result) {
        setFrontUrl(result.frontUrl);
        if (result.screenshot)
          setScreenshot(result.screenshot);
        if (result.seoAnalyse) {
          const seos = JSON.parse(result.seoAnalyse);
          if (seos) {
            setSeoAnalyzeErrors(seos.filter(item => item.level === "errors"));
            setSeoAnalyzeWarnings(seos.filter(item => item.level === "warnings"));
          }
        }
      }
    });
  }, [modifiedData]);

  return show ? <StyledHelper className="col-lg-3">
    <Padded top left right bottom size="smd">
      <Text fontWeight="bold">
        Preview
      </Text>
      <br />
      <figure>
        <a target="_blank" href={frontUrl} alt={frontUrl}><img width="300px" src={screenshot} /></a>
        <figcaption>Open front page</figcaption>
      </figure>
    </Padded>

    {seoAnalyseWarnings || seoAnalyseErrors ?
      <Padded top left right bottom size="smd">
        <Text fontWeight="bold">
          Seo rules to check
        </Text>
        <br />
        {seoAnalyseErrors ?
          <>
            <Text>Errors</Text>
            <ol className="errors">
              {seoAnalyseErrors.map(item => <li key={uuidv4()}>{item.message}<br />{item.content}</li>)}
            </ol>
          </>
          : <></>}
        <br />
        {seoAnalyseWarnings ?
          <>
            <Text>Warnings</Text>
            <ol className="warnings">
              {seoAnalyseWarnings.map(item => {
                if (!item.message.includes("Images should have alt tags"))
                  return <li key={uuidv4()}>{item.message}<br />{item.content}</li>
                else
                  return <li key={uuidv4()}>{item.message}<br /><img src={item.content} width="100px" alt="Images should have alt tags" /></li>
              })}
            </ol>
          </>
          : <></>
        }
      </Padded> : <></>}
  </StyledHelper> :
    <></>
}

const ExternalLink = () => {
  const [showPanel, setShowPanel] = useState(false);

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <>
      {ReactDOM.createPortal(<AnalysePanel show={showPanel} />, document.getElementById("app"))}
      <li>
        <StyledAHelper
          onClick={() => {
            togglePanel();
          }}
        >
          <i />
          <span>Show results from CMS ANALYZER</span>
        </StyledAHelper>
        <RefreshHtmlCode />
      </li>
    </>
  );
};

export default ExternalLink;