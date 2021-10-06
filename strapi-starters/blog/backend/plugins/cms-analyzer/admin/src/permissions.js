const pluginPermissions = {
  // This permission regards the main component (App) and is used to tell
  // If the plugin link should be displayed in the menu
  // And also if the plugin is accessible. This use case is found when a user types the url of the
  // plugin directly in the browser
  main: [{action: 'plugins::cms-analyzer.read', subject: null}],
  settings: [{ action: 'plugins::cms-analyzer.settings.read', subject: null }]
};

export default pluginPermissions;
