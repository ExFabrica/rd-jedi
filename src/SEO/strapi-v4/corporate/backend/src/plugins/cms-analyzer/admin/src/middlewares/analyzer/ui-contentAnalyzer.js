import { request } from '@strapi/helper-plugin';

const contentAnalyzerMiddleware = {
    get: async (url) => {
        try {
            return request(`/cms-analyzer/analyzer?url=${url}`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getContents: async () => {
        try {
            return request(`/cms-analyzer/contents`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getDocuments: async (query) => {
        try {
            return request(`/cms-analyzer/documents?api=${query}`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    runConsolidation: async (url) => {
        try {
            return request(`/cms-analyzer/consolidation?url=${url}`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getAnalyses: async () => {
        try {
            return request(`/cms-analyzer/analyses`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getAnalysesByDocumentId: async (documentId) => {
        try {
            return request(`/cms-analyzer/analyses/documents/${documentId}`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getMatchesByUID: async (uid) => {
        try {
            return request(`/cms-analyzer/matches/uid/${uid}`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getMatches: async (uid) => {
        try {
            return request(`/cms-analyzer/matches`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getRealTimeRulesAnalyze: async (payload) => {
        try {
            return await request("/cms-analyzer/runRealTimeRulesAnalyze", {
                method: 'POST',
                body:payload
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    }
}

export default contentAnalyzerMiddleware;