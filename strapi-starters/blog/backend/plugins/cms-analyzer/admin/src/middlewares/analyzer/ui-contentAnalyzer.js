import { request } from 'strapi-helper-plugin';

const contentAnalizerMiddleware = {
    get: async () => {
        const result = await request(`/cms-analyzer/analyzer`, {
            method: 'GET'
        });
        return result;
    }
}

export default contentAnalizerMiddleware;