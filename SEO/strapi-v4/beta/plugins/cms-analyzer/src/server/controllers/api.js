export default strapi => {
  return {
    upload(ctx, next) {
      strapi.service('plugins::upload.upload');
      // or strapi.service('upload', 'upload');
    },
  };
};
