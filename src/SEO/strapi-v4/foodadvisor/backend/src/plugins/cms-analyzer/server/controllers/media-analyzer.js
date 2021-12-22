'use strict';

module.exports = {
   async getImages(ctx) {
    // console.log (strapi.plugin('upload'));
    //  console.log ("contentTypes");
    //  console.log (strapi.plugin('upload').contentTypes);
    //  console.log ("controllers");
    //  console.log (strapi.plugin('upload').controllers);
    //  console.log ("services");
    //  console.log (strapi.plugin('upload').services);
    //  console.log (strapi.plugin('cms-analyzer').services["mediaAnalyzer"].msgTest());
 
    ctx.body = await strapi.plugin('cms-analyzer').services["mediaAnalyzer"].getImagesData()
  },
};
