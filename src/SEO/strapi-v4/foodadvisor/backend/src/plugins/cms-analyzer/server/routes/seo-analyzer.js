module.exports = {
    // accessible only from admin UI
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/seo-analyzer/run',
        handler: 'seo-analyzer.runConsolidation',
        config: { policies: [] }
      },
      {
        method: 'POST',
        path: '/seo-analyzer/runRT',
        handler: 'seo-analyzer.runRealTimeRulesAnalyze',
        config: { policies: [] }
      }
    ]
  }