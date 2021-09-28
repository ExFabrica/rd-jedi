import { request } from 'strapi-helper-plugin';

const contentAnalizerMiddleware = {
    get: async () => {
        const data = await request(`/cms-analyzer/analyzer`, {
            method: 'GET'
        });
        return data;
    }
}

export default contentAnalizerMiddleware;