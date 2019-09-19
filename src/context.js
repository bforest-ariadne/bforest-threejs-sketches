const WebGLApp = require('./webgl/WebGLApp');
const AssetManager = require('./util/AssetManager');
const query = require('./util/query');
const dat = require('dat.gui');
const defined = require('defined');

const viewport = document.getElementById('viewport');
const aside = document.getElementById('aside');

// Setup dat.gui
const gui = new dat.GUI({
  autoPlace: false,
  closed: false,
  hideable: true,
  resizable: true,
  scrollable: true
});

aside.appendChild(gui.domElement);

// Grab our canvas
const canvas = document.querySelector('.main-canvas');

// Setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  viewport,
  aside
});

// setup dev mode
if ( defined(query.dev) ) {
  webgl.setDev(true);
  global.gui = gui;
}

if ( !defined(query.gui, false) ) {
  gui.hide();
}

// Setup an asset manager
const assets = new AssetManager({
  renderer: webgl.renderer
});

webgl.assetManager = assets;
webgl.queueAssets();

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
