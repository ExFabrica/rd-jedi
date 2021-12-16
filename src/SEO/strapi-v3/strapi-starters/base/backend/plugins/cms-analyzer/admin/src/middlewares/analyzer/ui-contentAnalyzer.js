import { request } from 'strapi-helper-plugin';

const contentAnalizerMiddleware = {
    get: async () => {
        return await request(`/cms-analyzer/analyzer`, {
            method: 'GET'
        });
    }
}

export default contentAnalizerMiddleware;