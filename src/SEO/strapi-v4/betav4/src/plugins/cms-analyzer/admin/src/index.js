import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import pluginPermissions from './permissions';
import { StrapiZoneMarker } from './components/injected/strapi-zone-marker';
import { StrapiListZoneItem } from './components/injected/strapi-list-zone-item';
const name = pluginPkg.strapi.name;

export default {
  register(app) {
    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });

    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      Component: async () => {
        const component = await import(/* webpackChunkName: "[request]" */ './containers/App');

        return component;
      },
      //permissions: pluginPermissions.menu,
    });

    // Create the email settings section
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: { id: 'Analyzer Plugin', defaultMessage: 'Analyzer Plugin' },
      },
      [
        {
          intlLabel: {
            id: "Settings",
            defaultMessage: 'Settings',
          },
          id: 'settings',
          to: `/settings/${pluginId}`,
          Component: async () => {
            const component = await import(
                  /* webpackChunkName: "cms-analyzer-settings-page" */ './containers/Settings'
            );

            return component;
          },
          //permissions: pluginPermissions.settings,
        },
      ]
    );
  },

  bootstrap(app) { 
    // Inject component in Admin
    app.injectContentManagerComponent('editView', 'informations', {
      name: 'hal-9000',
      Component: StrapiZoneMarker,
    });

    app.injectContentManagerComponent('listView', 'actions', {
      name: 'hal-9000-list',
      Component: StrapiZoneMarker,
    });

    app.injectContentManagerComponent('listView', 'deleteModalAdditionalInfos', {
      name: 'hal-9000-modal',
      Component: StrapiZoneMarker,
    });

    app.injectContentManagerComponent('editView', 'right-links', {
      name: 'hal-9000-links',
      Component: StrapiListZoneItem,
    });

  },
  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map(locale => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
