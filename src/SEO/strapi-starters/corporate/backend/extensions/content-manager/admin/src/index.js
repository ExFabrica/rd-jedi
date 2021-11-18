import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import pluginLogo from './assets/images/logo.svg';
import App from './containers/Main';
import ConfigureViewButton from './InjectedComponents/ContentTypeBuilder/ConfigureViewButton';
import lifecycles from './lifecycles';
import reducers from './reducers';
import trads from './translations';
import ExternalLink from './injected-components/index';


export default (strapi) => {
    const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
    const plugin = {
        blockerComponent: null,
        blockerComponentProps: {},
        description: pluginDescription,
        icon: pluginPkg.strapi.icon,
        id: pluginId,
        initializer: null,
        injectedComponents: [
            {
                plugin: 'content-type-builder.listView',
                area: 'list.link',
                component: ConfigureViewButton,
                key: 'content-manager.link',
            },
            // This is the injection zone
            {
                plugin: 'content-manager.editView',
                area: 'right.links',
                component: ExternalLink,
                key: 'content-manager.preview-link',
            },
        ],
        injectionZones: {
            editView: { informations: [] },
            listView: { actions: [], deleteModalAdditionalInfos: [] },
        },
        isReady: true,
        isRequired: pluginPkg.strapi.required || false,
        layout: null,
        lifecycles,
        mainComponent: App,
        name: pluginPkg.strapi.name,
        pluginLogo,
        preventComponentRendering: false,
        reducers,
        trads,
    };

    return strapi.registerPlugin(plugin);
};