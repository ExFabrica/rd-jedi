module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  CLIENT_PREVIEW_SECRET: env('CLIENT_PREVIEW_SECRET', "6156165165165165"),
  CLIENT_URL: env('CLIENT_URL', "http://localhost:3000/preview"),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '9a432f54960ebe0538de5e02f47141c7'),
    },
  },
});
