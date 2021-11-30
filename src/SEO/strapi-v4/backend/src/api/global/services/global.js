'use strict';

/**
 * media service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::global.global');
