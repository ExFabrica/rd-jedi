export default strapi => {
  return {
    uploader: {
      upload() {
        console.log('Calling Upload service');
      },
    },
  };
};
