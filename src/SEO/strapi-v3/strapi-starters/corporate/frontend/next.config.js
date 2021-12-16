module.exports = {
  i18n: {
    locales: ["en", "fr"],
    defaultLocale: "en",
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    URI: process.env.NEXT_PUBLIC_STRAPI_API_URL
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    URI: process.env.NEXT_PUBLIC_STRAPI_API_URL
  }
}