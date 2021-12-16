module.exports = {
  // accessible only from admin UI
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/consolidation',
      handler: 'cms-analyzer.runConsolidation',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/runRealTimeRulesAnalyze',
      handler: 'cms-analyzer.runRealTimeRulesAnalyze',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/analyses',
      handler: 'analyse.findMany',
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
      handler: 'analyse.deleteOne',
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
      handler: 'match.findMany',
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
      handler: 'match.deleteOne',
      config: { policies: [] }
    },
    {
      method: 'DELETE',
      path: '/matches',
      handler: 'match.deleteAll',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/settings',
      handler: 'setting.getSettings',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/settings',
      handler: 'setting.setSettings',
      config: { policies: [] }
    },
  ]
}