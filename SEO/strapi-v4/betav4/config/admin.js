module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '20929d1e8619303fb52fde8a5b115df3'),
  },
});
