
'use strict';

module.exports = ({ strapi }) => ({
        async getImagesData(){ 
            let images_datas = {
                images_names : [],
                images: []
            };
            let medias;
            medias = await strapi.plugin('upload').service('upload').findMany();
            //console.log(entities);
             
            Object.values(medias).map(media => {
                if(media.mime.indexOf("image")!= -1){
                    if(!images_datas.images_names[media.name]) images_datas.images_names[media.name]=[];
                    images_datas.images_names[media.name].push(media.id);
                    images_datas.images.push({'id':media.id,'name':media.name,'atl-text':media.alternativeText,'caption':media.caption,'ext':media.ext});
                }
            });
            console.log(images_datas);
            return images_datas;
        }
});
