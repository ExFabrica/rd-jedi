module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/pages',
      handler: 'page.find',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/pages/:id',
      handler: 'page.findOne',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/pages',
      handler: 'page.create',
      config: { policies: [] }
    },
    {
      method: 'PUT',
      path: '/pages/:id',
      handler: 'page.update',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/pages/:id',
      handler: 'page.delete',
      config: { policies: [] }
    }
  ]
}