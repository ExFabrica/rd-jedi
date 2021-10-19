module.exports = (plugin, strapi) => {
  plugin.injectedZones.editView.block = [
    { name: 'test', Component: (props) => <button>'button'</button> },
  ];
};