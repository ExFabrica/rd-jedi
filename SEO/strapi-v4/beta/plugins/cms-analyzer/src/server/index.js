import config from './config';
import models from './models';
import initControllers from './controllers';
import initServices from './services';
import routes from './controllers/routes';
import hooks from './hooks';
import middlewares from './middlewares';
import policies from './policies';

export default (strapi) => {
  const services = initServices(strapi);
  const controllers = initControllers(strapi);

  return {
    register() {
      console.log("register")
    },
    bootstrap() {
      console.log("Bootstraping")
      strapi.logger.info('Bootstraping');
    },
    teardown() {
      console.log("teardown");
    },
    hooks() {
      console.log("hooks");
    },
    models,
    policies,
    middlewares,
    config,
    routes,
    controllers,
    services,
  };
};
