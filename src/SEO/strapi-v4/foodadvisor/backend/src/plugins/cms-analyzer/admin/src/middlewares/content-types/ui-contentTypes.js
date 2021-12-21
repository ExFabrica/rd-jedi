import { request } from '@strapi/helper-plugin';

const contentTypesMiddleware = {
    get: async () => {
        const data = await request(`/cms-analyzer/contenttypes`, {
            method: 'GET'
        });
        return data;
    }
}

export default contentTypesMiddleware;