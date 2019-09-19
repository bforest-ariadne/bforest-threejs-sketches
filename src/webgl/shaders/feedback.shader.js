// ported from https://jsfiddle.net/2awLpf5u/1/ https://github.com/vanruesc/postprocessing/issues/145

const glslify = require('glslify');
const path = require('path');

module.exports = require('shader-reload')({
  vertex: glslify(path.resolve(__dirname, './feedbackLive.vert')),
  fragment: glslify(path.resolve(__dirname, './feedbackLive.frag'))
});
