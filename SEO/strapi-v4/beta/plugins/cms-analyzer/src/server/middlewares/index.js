export default {
  // same API as before
  someMiddleware(strapi) {
    return {
      defaults: {},
      beforeInitialize() {},
      initialize() {},
    };
  },
};
