const WebGLApp = require('./webgl/WebGLApp');
const AssetManager = require('./util/AssetManager');
const query = require('./util/query');
const dat = require('dat.gui');
const defined = require('defined');
const Tweakpane = require('tweakpane');

const viewport = document.getElementById('viewport');
const aside = document.getElementById('aside');

const cargo = document.location.host.includes('cargo') ||
document.location.host.includes('ben-forest.com');

if ( cargo ) console.log('cargo site detected!');

// Setup dat.gui
// const gui = new dat.GUI({
//   autoPlace: false,
//   closed: false,
//   hideable: true,
//   resizable: true,
//   scrollable: true
// });
let gui;

if ( defined(query.dev) || document.location.hash.includes('dev') ) {
  gui = new Tweakpane({
    container: document.getElementById('aside'),
    title: 'parameters'
  });

  // tweaksphere -> dat.gui mixins
  if ( defined( gui.document ) ) {
    let guiDatMixin = {
      add( object, key, min, max, step ) {
        let opt = {};
        if ( typeof min !== 'undefined' ) opt.min = min;
        if ( typeof max !== 'undefined' ) opt.max = max;
        if ( typeof step !== 'undefined' ) opt.step = step;
        console.log('opt', opt, min, max);
        return this.addInput( object, key, opt );
      }
    };

    let inputBindingMixin = {
      onChange( cb ) {
        return this.on( 'change', cb );
      }
    };
    // apply Tweakpanel -> dat.gui mixin
    Object.assign( gui.__proto__, guiDatMixin );

    // apply Tweakpanel.inputAPI -> dat.gui.inputController mixin
    let testParams = {'test': 'test'};
    let input = gui.addInput( testParams, 'test' );
    Object.assign( input.__proto__, inputBindingMixin );
    input.dispose();

    let folder = gui.addFolder({title: 'test'});
    Object.assign( folder.__proto__, guiDatMixin );
    folder.dispose();

    gui.element.style.backgroundColor = '#2f3137a1';
    gui.element.style.cssText = `
    background-color: rgba(47, 49, 55, 0.63);
    overflow-y: overlay;
    max-height: 100%;
    `;
  }
}

// aside.appendChild(gui.domElement);

// Grab our canvas
const canvas = document.querySelector('.main-canvas');

// Setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  viewport,
  aside,
  cargo,
  gui
});

// setup dev mode
if ( defined(query.dev) || document.location.hash.includes('dev') ) {
  webgl.setDev(true);
  global.gui = gui;
}

if ( !defined(query.gui, false) ) {
  // gui.hide();
}

// Setup an asset manager
const assets = new AssetManager({
  renderer: webgl.renderer,
  cargo: cargo
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
