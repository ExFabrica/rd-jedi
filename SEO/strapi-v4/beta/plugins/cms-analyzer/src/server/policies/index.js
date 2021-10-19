export default {
  async ['my-policy'](ctx, next) {
    await next();
  },
};
