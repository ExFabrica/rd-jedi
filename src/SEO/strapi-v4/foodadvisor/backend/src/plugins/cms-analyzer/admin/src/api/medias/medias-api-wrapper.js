import { request } from '@strapi/helper-plugin';

const mediaAPIWrapper = {
    runConsolidation: async (url) => {
        try {
            return request(`/cms-analyzer/medias/consolidation?url=${url}`, {
                method: 'GET'
            });
        }
        catch (ex) {
            console.log("Error: ", ex);
        }
    },
}

export default mediaAPIWrapper;