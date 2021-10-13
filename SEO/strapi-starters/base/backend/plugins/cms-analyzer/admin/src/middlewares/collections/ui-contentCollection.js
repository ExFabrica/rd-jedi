import { request } from 'strapi-helper-plugin';

const collectionsMiddleware = {
    find: async (collectionName) => {
        const data = await request(`/${collectionName}`, {
            method: 'GET'
        });
        return data;
    },
    findOne: async (collectionName, uid) => {
        const data = await request(`/${collectionName}`, {
            method: 'GET'
        });
        return data;
    },
    count: async (collectionName) => {
        const data = await request(`/${collectionName}/count`, {
            method: 'GET'
        });
        return data;
    }
}

export default collectionsMiddleware;