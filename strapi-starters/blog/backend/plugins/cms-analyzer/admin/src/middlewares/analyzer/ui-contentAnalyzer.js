import { request } from 'strapi-helper-plugin';

const contentAnalizerMiddleware = {
    get: async (url) => {
        const result = await request(`/cms-analyzer/analyzer?url=${url}`, {
            method: 'GET'
        });
        return result;
    },
    getContents: async () => {
        const result = await request(`/cms-analyzer/contents`, {
            method: 'GET'
        });
        return result;
    },
    getDocuments: async (query) => {
        const result = await request(`/cms-analyzer/documents?api=${query}`, {
            method: 'GET'
        });
        return result;
    },
    getConsolidation: async (url) => {
        const result = await request(`/cms-analyzer/consolidation?url=${url}`, {
            method: 'GET'
        });
        return result;
    }
}

export default contentAnalizerMiddleware;