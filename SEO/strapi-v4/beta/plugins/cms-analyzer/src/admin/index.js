// import pluginIcon from './icon.svg';

const Main = () => 'Main';

const Foo = () => 'Foo';

export default () => {
  console.log("boqposfdjlmsdlfsdf");
  return {
    register(app) {
      app.menu.addSection({
        label: { id: 'upload', defaultMessage: 'Upload' },
        to: '/upload',
        component: Main,
        permissions: [],
      });
      app.componentsStore.add({ name: 'Foo', Component: Foo });
      app.store.reducers.add({
        id: 'upload',
        reducers: {
          main: (state) => state,
        },
      });
    },
    bootstrap(app) {},
    id: 'upload',
    // icon: pluginIcon,
    description: 'upload.description',
    decorators: {},
    injectionZones: {}, // Still working on the naming
  };
};
