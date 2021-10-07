import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import App from './containers/App';
import Initializer from './containers/Initializer';
import lifecycles from './lifecycles';
import trads from './translations';
import React from 'react';
import { CheckPagePermissions } from 'strapi-helper-plugin';
import pluginPermissions from './permissions';
import SettingsPage from './containers/Settings';
import contentAnalyzerMiddleware from "./middlewares/analyzer/ui-contentAnalyzer";

export default strapi => {
  const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
  const icon = pluginPkg.strapi.icon;
  const name = pluginPkg.strapi.name;
  let loaded = false;

  const plugin = {
    blockerComponent: null,
    blockerComponentProps: {},
    description: pluginDescription,
    icon,
    id: pluginId,
    initializer: Initializer,
    injectedComponents: [],
    isReady: false,
    isRequired: pluginPkg.strapi.required || false,
    layout: null,
    lifecycles,
    mainComponent: App,
    name,
    preventComponentRendering: false,
    trads,
    menu: {
      pluginsSectionLinks: [
        {
          destination: `/plugins/${pluginId}`,
          icon,
          label: {
            id: `${pluginId}.plugin.name`,
            defaultMessage: name,
          },
          name,
          permissions: pluginPermissions.main,
        },
      ],
    },
    settings: {
      menuSection: {
        id: pluginId,
        title: "CMS Analyzer",
        links: [
          {
            title: {
              id: "Settings",
              defaultMessage: 'Settings',
            },
            name: 'settings',
            to: `${strapi.settingsBaseURL}/${pluginId}`,
            Component: () =>
              <CheckPagePermissions permissions={pluginPermissions.settings}>
                <SettingsPage />
              </CheckPagePermissions>,
            permissions: pluginPermissions.settings,
          },
        ],
      },
    },
    boot(app) {
      if (!loaded) {
        console.log("HOOOOO")
        // fill all data for CMS analyzer.
        contentAnalyzerMiddleware.getAnalyses().then((analyses) => {
          if (analyses && analyses.length === 0)
            contentAnalyzerMiddleware.getConsolidation("http://localhost:3000").then(() => {
              loaded = true;
            })
        })
      }
    },
  };

  return strapi.registerPlugin(plugin);
};
