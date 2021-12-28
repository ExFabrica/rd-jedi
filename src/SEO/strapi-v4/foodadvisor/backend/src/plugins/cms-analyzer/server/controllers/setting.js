'use strict';
const _ = require('lodash');

module.exports = ({ strapi }) => {
  const settingService = strapi.plugins["cms-analyzer"].services.setting;
  const getSettings = async (ctx) => {
    try {
      return settingService.getSettings();
    }
    catch (err) {
      ctx.throw(500, err);
    }
  }
  const setSettings = async (ctx)  => {
    const { body } = ctx.request;
    try {
      await settingService.setSettings(body);
      return this.getSettings();
    }
    catch (err) {
      ctx.throw(500, err);
    }
  }
  return {
    getSettings,
    setSettings
  }
};
