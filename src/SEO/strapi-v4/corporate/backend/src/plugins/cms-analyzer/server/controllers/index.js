"use strict"

const match = require("./match");
const cmsAnalyzer = require("./cms-analyzer");
const analyse = require("./analyse");
const setting = require("./setting");
const example = require("./example");

module.exports = {
  analyse,
  "cms-analyzer": cmsAnalyzer,
  match,
  setting,
  example
};
