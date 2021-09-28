'use strict';

/**
 * cms-analyzer.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */
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
        setting1: '',
        setting2: true,
        setting3: 0,
        setting4: { inner1: "" },
    }
    await pluginStore.set({ key: 'settings', value });
    return await pluginStore.get({ key: 'settings' });
};
const createConfigFromData = async (data) => {
    //mapping
    const value = {
        setting1: data.setting1,
        setting2: data.setting2,
        setting3: data.setting3,
        setting4: { inner1: data.setting4.inner1 },
    }

    const pluginStore = getPluginStore();
    await pluginStore.set({ key: 'settings', value});
    return await pluginStore.get({ key: 'settings' });
};

module.exports = {
    //SETTINGS
    getSettings: async () => {
        const pluginStore = getPluginStore();
        let config = await pluginStore.get({ key: 'settings' });
        if (!config) {
            config = await createDefaultConfig();
        }
        return config;
    },
    setSettings: async (data) => {
        return await createConfigFromData(data);
    },

    //CONTENT-TYPES
    getContentTypes: async () => {
        let contentTypes = [];
        Object.values(strapi.contentTypes).map(contentType => {
            if ((contentType.kind === "collectionType" || contentType.kind === "singleType") && !contentType.plugin) {
                contentTypes.push(contentType);
            }
        });
        return contentTypes;
    },
};
