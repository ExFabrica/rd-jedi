/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { NotFound } from '@strapi/helper-plugin';
import { Box } from '@strapi/design-system/Box';
import { Layout } from '@strapi/design-system/Layout';

import pluginId from '../../pluginId';
import HomePage from '../HomePage';
import SeoPage from '../SeoPage';
import MediaPage from '../MediaPage';
import GreenPage from '../GreenPage';
import AnalyzerNav from "../../components/CmsAnalyzerNav"
const App = () => {
  return (
    <Layout sideNav={<AnalyzerNav/>}>
    <Box background="neutral100">
      <Switch>
         <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
         {/* <Route path={`/plugins/${pluginId}/seo`} component={SeoPage} exact /> */}
         <Route path={`/plugins/${pluginId}/media`} component={MediaPage} exact />
         <Route path={`/plugins/${pluginId}/green`} component={GreenPage} exact />
         <Route component={NotFound} />
       </Switch>
    </Box>
    </Layout>
  );
};

export default App;
