module.exports = {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/medias',
        handler: 'media.findMany',
        config: { policies: [] }
      }
    ]
  }