module.exports = {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/medias/consolidation',
        handler: 'media.runConsolidation',
        config: { policies: [] }
      }
    ]
  }