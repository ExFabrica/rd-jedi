"use strict"

const match = require("./match");
const cmsAnalyzer = require("./cms-analyzer");
const analyse = require("./analyse");
const setting = require("./setting");
const example = require("./example");
const mediaAnalyzer = require("./media-analyzer")

module.exports = {
  analyse,
  cmsAnalyzer,
  match,
  setting,
  example,
  mediaAnalyzer
};
