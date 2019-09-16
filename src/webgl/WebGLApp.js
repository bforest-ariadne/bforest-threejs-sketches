const { EventEmitter } = require('events');
const assign = require('object-assign');
const defined = require('defined');
const rightNow = require('right-now');
// const createOrbitControls = require('orbit-controls');
const createTouches = require('touches');
const query = require('../util/query');
const { isDefined, isNotUndefined } = require('w-js/build/W.js');

const tmpTarget = new THREE.Vector3();

module.exports = class WebGLApp extends EventEmitter {

  constructor (opt = {}) {
    super();
    this.opt = opt;
    this.query = query;
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.lastTimeMsec = null;

    this.renderer = new THREE.WebGLRenderer(assign({
      antialias: false,
      alpha: false,
      // enabled for saving screen shots of the canvas,
      // may wish to disable this for perf reasons
      preserveDrawingBuffer: true,
      failIfMajorPerformanceCaveat: true
    }, opt));

    this.renderer.domElement.style.position = 'fixed';
    this.renderer.setPixelRatio( window.devicePixelRatio );

    this.renderer.sortObjects = false;
    this.canvas = this.renderer.domElement;

    // really basic touch handler that propagates through the scene
    this.touchHandler = createTouches(this.canvas, {
      // filtered: false
      target: this.canvas,
      filtered: true
    });
    this.touchHandler.on('start', (ev, pos) => this._traverse('onTouchStart', ev, pos));
    this.touchHandler.on('end', (ev, pos) => this._traverse('onTouchEnd', ev, pos));
    this.touchHandler.on('move', (ev, pos) => this._traverse('onTouchMove', ev, pos));

    // default background color
    const background = defined(opt.background, '#fff');
    const backgroundAlpha = defined(opt.backgroundAlpha, 1);
    this.renderer.setClearColor(background, backgroundAlpha);

    // clamp pixel ratio for performance
    this.maxPixelRatio = defined(opt.maxPixelRatio, 2);

    // clamp delta to stepping anything too far forward
    this.maxDeltaTime = defined(opt.maxDeltaTime, 1 / 30);

    // setup a basic camera
    const fov = defined(opt.fov, 45);
    const near = defined(opt.near, 0.01);
    const far = defined(opt.far, 100);
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);

    // setup init properties
    this.time = 0;
    this._running = false;
    this._lastTime = rightNow();
    this._rafID = null;
    this.dev = isDefined( query.dev ) ? query.dev : false;

    this.scene = new THREE.Scene();

    // handle resize events
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => this.resize());

    // force an initial resize event
    this.resize();
  }

  get running () {
    return this._running;
  }

  resize (width, height, pixelRatio) {
    // get default values
    width = defined(width, window.innerWidth);
    height = defined(height, window.innerHeight);
    pixelRatio = defined(pixelRatio, Math.min(this.maxPixelRatio, window.devicePixelRatio));

    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    // update pixel ratio if necessary
    if (this.renderer.getPixelRatio() !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio);
    }

    // setup new size & update camera aspect if necessary
    this.renderer.setSize(width, height);
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height;
    }
    this.camera.updateProjectionMatrix();

    this._traverse('onResize');

    // draw a frame to ensure the new size has been registered visually
    this.draw();
    return this;
  }

  // convenience function to trigger a PNG download of the canvas
  saveScreenshot (opt = {}) {
    // force a specific output size
    this.resize(defined(opt.width, 2560), defined(opt.height, 1440), 1, true);
    this.draw();

    const dataURI = this.canvas.toDataURL('image/png');

    // reset to default size
    this.resize();
    this.draw();

    // save
    const file = defined(opt.fileName, defaultFile('.png'));
    saveDataURI(file, dataURI);
  }

  update (dt = 0, time = 0) {
    // recursively tell all child objects to update
    this.scene.traverse(obj => {
      if (typeof obj.update === 'function') {
        obj.update(dt, time);
      }
    });

    return this;
  }

  draw () {
    this.renderer.render(this.scene, this.camera);
    return this;
  }

  animate = nowMsec => {
    if (!this.running) return;
    window.requestAnimationFrame(this.animate);

    // measure time
    this.lastTimeMsec = this.lastTimeMsec || nowMsec - 1000 / 60;
    this.lastTimeMsec = nowMsec;
    this.delta = this.clock.getDelta();

    this.update( this.delta, nowMsec / 1000, this.frameCount );
    this.draw();
    this.frameCount++
  }

  debug() {
    global.renderer = this.renderer;
    global.camera = this.camera;
    global.scene = this.scene;
    global.app = this;

    this.scene.traverse(obj => {
      if (typeof obj.debug === 'function') {
        obj.debug();
      }
    });
    // auto name object3ds based on key name
    this.nameMeshes(this);
    // name objects in scenes
    for ( let child in this.scene.children ) this.nameMeshes( this.scene.children[child] );
    // name remaining unnamed obj3ds with their type
    webgl.scene.traverse( function(c) { if(c.name === '' )c.name = c.type;  } )
  }

  start () {
    this.log('app start');
    if ( this.dev && this.frameCount === 0 ) {
      this.debug();
    }

    if (this._rafID !== null) return;
    this._rafID = window.requestAnimationFrame(this.animate);
    this._running = true;
    return this;
  }

  stop () {
    if (this._rafID === null) return;
    window.cancelAnimationFrame(this._rafID);
    this._rafID = null;
    this._running = false;
    return this;
  }

  _traverse = (fn, ...args) => {
    this.scene.traverse(child => {
      if (typeof child[fn] === 'function') {
        child[fn].apply(child, args);
      }
    });
  }

  setDev = (dev) => {
    dev = defined(dev, false);
    this.dev = dev;
  }

  nameMeshes( obj3d ) {
    for ( var key in obj3d ) {
      if (
        typeof obj3d[key] === 'object' &&
        obj3d[key] !== null &&
        !key.includes('_') &&
        obj3d[key].isObject3D !== null &&
        typeof obj3d[key].isObject3D !== 'undefined' &&
        key !== 'parent' ) {
        if ( obj3d[key].name === '' ) obj3d[key].name = key;
      }
    }
  }

  log() {
    // logging for debug only
    if ( this.dev ) {
      const css = 'background: #ff00ff; color: #ff00ff';
      const text = ' ';
      let cssArray = ['%c '.concat(text), css];
      var args = Array.prototype.slice.call(arguments);
      let final = cssArray.concat(args);
      console.log.apply(this, final);
    }
  }

}

function dataURIToBlob (dataURI) {
  const binStr = window.atob(dataURI.split(',')[1]);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new window.Blob([arr]);
}

function saveDataURI (name, dataURI) {
  const blob = dataURIToBlob(dataURI);

  // force download
  const link = document.createElement('a');
  link.download = name;
  link.href = window.URL.createObjectURL(blob);
  link.onclick = () => {
    process.nextTick(() => {
      window.URL.revokeObjectURL(blob);
      link.removeAttribute('href');
    });
  };
  link.click();
}

function defaultFile (ext) {
  const str = `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}${ext}`;
  return str.replace(/\//g, '-').replace(/:/g, '.');
}