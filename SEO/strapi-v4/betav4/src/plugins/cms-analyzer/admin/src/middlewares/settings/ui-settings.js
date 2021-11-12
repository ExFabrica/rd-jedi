import { request } from '@strapi/helper-plugin';

const settingsMiddleware = {
    get: async () => {
        const data = await request(`/cms-analyzer/settings`, {
            method: 'GET'
        });
        return data;
    },
    set: async (data) => {
        return await request(`/cms-analyzer/settings`, {
            method: 'POST',
            body: data
        });
    }
}

export default settingsMiddleware;