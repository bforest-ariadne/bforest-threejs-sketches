const WebGLApp = require('./webgl/WebGLApp');
const AssetManager = require('./util/AssetManager');
const query = require('./util/query');
const dat = require('dat.gui');

const viewport = document.getElementById('viewport');
const aside = document.getElementById('aside');
// Setup dat.gui
const gui = new dat.GUI({ autoPlace: false });
aside.appendChild(gui.domElement);

if (!query.gui) {
  document.querySelector('.dg.main.a').style.display = 'none';
}

// Grab our canvas
const canvas = document.querySelector('.main-canvas');

// Setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  viewport,
  aside
});

// setup dev mode
if (query.dev) {
  console.log('dev mode');
  webgl.setDev(true);
}

// Setup an asset manager
const assets = new AssetManager({
  renderer: webgl.renderer
});

if (webgl.dev) {
  global.assets = assets;
  global.webgl = webgl;
}

module.exports = {
  assets,
  canvas,
  webgl,
  gui
};
