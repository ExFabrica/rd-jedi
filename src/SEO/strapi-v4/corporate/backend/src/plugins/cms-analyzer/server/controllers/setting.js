'use strict';
const _ = require('lodash');

module.exports = ({ strapi }) => {
  const settingService = strapi.plugins["cms-analyzer"].services.setting;
  const getSettings = async (ctx) => {
    let config = {};
    try {
      config = await settingService.getSettings();
      ctx.send(config);
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
  }
  const setSettings = async (ctx)  => {
    let config = {};
    const { body } = ctx.request;
    try {
      await settingService.setSettings(body);
      config = await this.getSettings();
    }
    catch (ex) {
      ctx.send({ "status": 500, message: ex });
    }
    ctx.send(config);
  }
  return {
    getSettings,
    setSettings
  }
};
