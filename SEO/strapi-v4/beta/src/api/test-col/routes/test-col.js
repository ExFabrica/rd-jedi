module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/test-cols',
      handler: 'test-col.find',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/test-cols/:id',
      handler: 'test-col.findOne',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/test-cols',
      handler: 'test-col.create',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/test-cols/:id',
      handler: 'test-col.update',
      config: {
        policies: [],
      },
    },
    {
      method: 'DELETE',
      path: '/test-cols/:id',
      handler: 'test-col.delete',
      config: {
        policies: [],
      },
    },
  ],
};
