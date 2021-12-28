module.exports = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/medias',
      handler: 'match.findMany',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/medias/:slug',
      handler: 'match.findOne',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/medias/uid/:slug',
      handler: 'match.findByUid',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/medias',
      handler: 'match.create',
      config: { policies: [] }
    },
    {
      method: 'PUT',
      path: '/medias/:id',
      handler: 'match.update',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/medias/:id',
      handler: 'match.deleteOne',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/medias',
      handler: 'match.deleteAll',
      config: { policies: [] }
    }
  ]
}