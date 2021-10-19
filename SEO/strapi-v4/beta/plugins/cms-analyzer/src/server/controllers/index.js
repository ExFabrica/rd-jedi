import adminController from './admin';
import apiController from './api';

export default strapi => {
  console.log("dswxfdsqff");
  return {
    admin: adminController(strapi),
    api: apiController(strapi),
  };
};
