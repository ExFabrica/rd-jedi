"use strict"

const match = require("./match");
const cmsAnalyzer = require("./cms-analyzer");
const analyse = require("./analyse");
const setting = require("./setting");
const example = require("./example");
const mediaAnalyzerCtrl = require("./media-analyzer");

module.exports = {
  analyse,
  "cms-analyzer": cmsAnalyzer,
  match,
  setting,
  example,
  "media-analyzer":mediaAnalyzerCtrl,
};
