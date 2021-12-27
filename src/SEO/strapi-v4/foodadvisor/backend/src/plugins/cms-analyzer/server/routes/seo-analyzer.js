module.exports = {
    // accessible only from admin UI
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/consolidation',
        handler: 'seo-analyzer.runConsolidation',
        config: { policies: [] }
      },
      {
        method: 'POST',
        path: '/runRealTimeRulesAnalyze',
        handler: 'seo-analyzer.runRealTimeRulesAnalyze',
        config: { policies: [] }
      }
    ]
  }