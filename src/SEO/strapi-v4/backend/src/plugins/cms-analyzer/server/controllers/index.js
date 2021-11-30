"use strict"

const match = require("./match");
const cmsAnalyzer = require("./cms-analyzer");
const analyse = require("./analyse");

module.exports = {
  analyse,
  "cms-analyzer": cmsAnalyzer,
  match
};
