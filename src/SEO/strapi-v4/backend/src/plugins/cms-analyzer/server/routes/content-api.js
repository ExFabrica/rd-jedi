module.exports = {
  // accessible from external endpoint (/api/cms-analyzer/***)
  //type: 'content-api',
  // accessible only from admin
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/contenttypes',
      handler: 'cms-analyzer.getContentTypes',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/documents',
      handler: 'cms-analyzer.getDocuments',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/contents',
      handler: 'cms-analyzer.getContents',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/consolidation',
      handler: 'cms-analyzer.runConsolidation',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/settings',
      handler: 'cms-analyzer.getSettings',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/settings',
      handler: 'cms-analyzer.setSettings',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/analyzer',
      handler: 'cms-analyzer.getAnalyzer',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/analyses',
      handler: 'analyse.find',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/analyses/:id',
      handler: 'analyse.findOne',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/analyses/documents/:documentId',
      handler: 'analyse.findByDocumentId',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/analyses',
      handler: 'analyse.create',
      config: { policies: [] }
    },
    {
      method: 'PUT',
      path: '/analyses/:id',
      handler: 'analyse.update',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/analyses/:id',
      handler: 'analyse.delete',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/analyses',
      handler: 'analyse.deleteAll',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/matches',
      handler: 'match.find',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/matches/:slug',
      handler: 'match.findOne',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/matches/uid/:slug',
      handler: 'match.findByUid',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/matches',
      handler: 'match.create',
      config: { policies: [] }
    },
    {
      method: 'PUT',
      path: '/matches/:id',
      handler: 'match.update',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/matches/:id',
      handler: 'match.delete',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/matches',
      handler: 'match.deleteAll',
      config: { policies: [] }
    }
  ]
}