import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useContentManagerEditViewDataManager, request } from 'strapi-helper-plugin';

const StyledHelper = styled.div`
  position:fixed;
  bottom:20px;
  display: block;
  border:1px solid #e3e9f3;
  border-radius: 10px;
  right:20px;
  width:400px;
  height:500px;
  overflow-x:hidden;
  overflow-y:auto;
  padding:5px;
  box-shadow: 0 2px 4px #e3e9f3;
  .warnings,
  .errors {
    padding:0px;
  }
  .errors li {
    list-style-type: none;
    counter-increment: item;
    padding:5px;
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
`;

const ExternalLink = () => {
  const context = useContentManagerEditViewDataManager();
  const { modifiedData, layout } = context;
  const [screenshot, setScreenshot] = useState();
  const [seoAnalyse, setSeoAnalyze] = useState();

  /*console.log("modifiedData", modifiedData);
  console.log("layout", layout);
  console.log("context", context);*/

  useEffect(() => {
    request(`/cms-analyzer/analyses/documents/${modifiedData.id}`, {
      method: 'GET'
    }).then(result => {
      console.log("result", result);
      setScreenshot(result.screenshot);
      if (result && result.seoAnalyse) {
        const seos = JSON.parse(result.seoAnalyse);
        console.log("seos", seos);
        setSeoAnalyze(seos);
      }
    });
  }, [modifiedData]);

  return (
    <StyledHelper className="col-3">
      <h3>Preview</h3>
      <img width="390px" src={screenshot}/>
      <h3>Seo rules to check</h3>
      <h4>Errors</h4>
      <ol className="errors">
        {seoAnalyse ?
          seoAnalyse.filter(item => item.level === "errors").map(item => <li>{item.message}</li>)
          : <></>}
      </ol>
      <h4>Warnings</h4>
      <ol className="warnings">
        {seoAnalyse ?
          seoAnalyse.filter(item => item.level === "warnings").map(item => <li>{item.message}</li>)
          : <></>}
      </ol>
    </StyledHelper>
  );
};

export default ExternalLink;