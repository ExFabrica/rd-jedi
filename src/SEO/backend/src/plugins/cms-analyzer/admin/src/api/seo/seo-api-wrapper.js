import { request } from '@strapi/helper-plugin';

const contentAnalyzerAPI = {
    /*get: async (url) => {
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
    },*/
    run: async (payload, abortSignal) => {
        try {
            return request(`/cms-analyzer/seo-analyzer/run`, {
                method: 'POST',
                body:payload,
                signal: abortSignal,
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
    getAnalysesByDocumentId: async (apiName, documentId) => {
        try {
            return request(`/cms-analyzer/analyses/api/${apiName}/documents/${documentId}`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    getSortedAnalyses: async () => {
        try {
            return request("/cms-analyzer/analyses/sorted/rank", {
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
    runRT: async (payload) => {
        try {
            return await request("/cms-analyzer/seo-analyzer/runRT", {
                method: 'POST',
                body:payload
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
    isRunning: async () => {
        try {
            return await request("/cms-analyzer/seo-analyzer/isRunning", {
                method: 'GET',
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    }
}

export default contentAnalyzerAPI;