module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/images',
      handler: 'media-analyzer.getImages',
      config: { policies: [] }
    }
  ]
}