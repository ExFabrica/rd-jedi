"use strict"

const match = require("./match");
const seoAnalyzer = require("./seo-analyzer");
const analyse = require("./analyse");
const setting = require("./setting");
const example = require("./example");
const mediaAnalyzer = require("./media-analyzer");
const media = require("./media");

module.exports = {
  analyse,
  seoAnalyzer,
  match,
  setting,
  example,
  mediaAnalyzer,
  media
};
