'use strict';
const analyzer = require('exfabrica-cms-engine-analyzer');
const _ = require('lodash');

module.exports = ({ strapi }) => {
    const getPluginStore = () => {
        return strapi.store({
            environment: '',
            type: 'plugin',
            name: 'cms-analyzer',
        });
    };
    const createDefaultConfig = async () => {
        const pluginStore = getPluginStore();
        const value = {
            frontUrl: '',
            enabled: true,
        }
        await pluginStore.set({ key: 'settings', value });
        return pluginStore.get({ key: 'settings' });
    };
    const createConfigFromData = async (data) => {
        //mapping
        const value = {
            frontUrl: data.frontUrl,
            enabled: data.enabled,
        }

        const pluginStore = getPluginStore();
        await pluginStore.set({ key: 'settings', value });
        return pluginStore.get({ key: 'settings' });
    };

    const getSettings = async () => {
        const pluginStore = getPluginStore();
        let config = await pluginStore.get({ key: 'settings' });
        if (!config) {
            config = await createDefaultConfig();
        }
        return config;
    };
    const setSettings = async (data) => {
        return createConfigFromData(data);
    };
    return {
        getSettings,
        setSettings
    }
}