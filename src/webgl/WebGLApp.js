const { EventEmitter } = require('events');
const assign = require('object-assign');
const defined = require('defined');
const rightNow = require('right-now');
const { getGPUTier } = require('../vendor/detect-gpu.cjs');
const exportGLTF = require('../util/exportGLTF');
const isMobile = require('../util/isMobile.js');
const getRenderer = require('../util/getRenderer');
const createTouches = require('../vendor/touches/index.js');
const query = require('../util/query');
const noop = () => {};
const Stats = require('stats.js');
const Physics = require('./physics/physics-interface');
const { SMAAEffect } = require('postprocessing');

module.exports = class WebGLApp extends EventEmitter {
  constructor (opt = {}) {
    super();
    this.opt = opt;
    this.dev = defined( query.dev, false );
    this.canvas = opt.canvas;
    this.cargo = opt.cargo;
    this.viewport = opt.viewport;
    this.aside = opt.aside;
    this.query = query;
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.lastTimeMsec = null;
    this.loadingPage = document.getElementById('loadingPage');
    this.assetManager = {};
    this.onRenderFcts = [];
    this.sceneName = 'test';
    this.physicsReady = true;
    this.onReady = noop;
    this.ready = false;
    this.shown = false;
    this.stats = new Stats();
    this.stats.domElement.style.display = this.dev ? '' : 'none';
    this.aside.appendChild( this.stats.dom );

    this.mobile = isMobile;

    this.stoppedDiv = document.createElement('div');
    this.stoppedDiv.id = 'stopped';
    this.stoppedDiv.style.cssText = 'position: fixed; width: 100%; height: 100%; z-index: 2147483647; background-color: black; opacity: 0.5; display: none; top: 0px;';
    if ( document.getElementById('stopped') !== null ) this.stoppedDiv = document.getElementById('stopped');
    this.viewport.appendChild( this.stoppedDiv );
    const hide = document.getElementById('hide');
    if ( this.mobile ) hide.textContent = 'Two finger tap to hid the overlay';

    // really basic touch handler that propagates through the scene
    this.touchHandler = createTouches(this.viewport, {
      // filtered: false
      target: this.viewport,
      filtered: true
    });
    this.touchHandler.on('start', (ev, pos) => this.onTouchStart(ev, pos));
    this.touchHandler.on('end', (ev, pos) => this.onTouchEnd(ev, pos));
    this.touchHandler.on('move', (ev, pos) => this.onTouchMove(ev, pos));

    document.addEventListener('keydown', ev => this.onKeydown(ev) );

    this.renderer = new THREE.WebGLRenderer(assign({
      antialias: false,
      alpha: false,
      logarithmicDepthBuffer: true,
      // enabled for saving screen shots of the canvas,
      // may wish to disable this for perf reasons
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: true
    }, opt));

    // getRenderer(function(renderer) { console.log(renderer); } );

    this.setGpuInfo();

    this.renderer.domElement.style.position = 'fixed';
    // this.renderer.sortObjects = false;
    this.canvas = this.renderer.domElement;

    // default background color
    const background = defined(opt.background, '#000');
    const backgroundAlpha = defined(opt.backgroundAlpha, 1);
    this.renderer.setClearColor(background, backgroundAlpha);

    // clamp pixel ratio for performance
    this.maxPixelRatio = defined(opt.maxPixelRatio, this.gpuInfo.tierNum);
    this.renderer.setPixelRatio( this.maxPixelRatio );

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

    this.scene = new THREE.Scene();

    this.on( 'show', () => {
      this.shown = true;
      if ( this.dev ) {
        this.log( 'shown at frame ', this.frameCount );
      }
    });

    if ( this.cargo ) {
      const container = this.viewport.parentNode;
      container.style.width = this.mobile ? '100%' : '65%';
      this.log( 'cargo width', container.style.width );
      this.resize();

      // eslint-disable-next-line no-undef
      Cargo.Event.on('mobile_breakpoint_triggered', e => {
        if ( typeof e === 'undefined' ) return;
        container.style.width = e ? '65%' : '100%';
        this.resize();
      });

      this.on( 'frame2', () => { this.resize(); });
      this.hideOverlay();

      // eslint-disable-next-line no-undef
      Cargo.Event.on('add_history', e => {
        console.log('cargo history', e );
        if ( e === 'Home-webgl' ) {
          this.viewport.parentNode.style.display = '';
          this.start();
        } else {
          this.viewport.parentNode.style.display = 'none';
          this.stop();
        }
      } );
    }

    // handle resize events
    window.addEventListener('resize', () => { this.resize(); } );
    if ( this.cargo ) this.viewport.addEventListener( 'resize', () => { this.resize(); } );
    window.addEventListener('orientationchange', () => { this.resize(); } );

    // force an initial resize event
    this.resize();
  }

  initPhysics() {
    // init physics
    this.physicsReady = false;
    this.physics = new Physics( this, {
      onReady: () => {
        this.physicsReady = true;
        this.onRenderFcts.push( (delta, now, frameCount) => {
          this.physics.update( delta );
          // this.glStats.set( 'cannon', 1 / ( this.physics.cannonFrame / 1000 ) );
        });
      }
    });
  }

  get running () {
    return this._running;
  }

  update (delta = 0, now = 0, frame = 0) {
    // recursively tell all child objects to update

    this.onRenderFcts.forEach( ( onRenderFct ) => {
      onRenderFct( delta, now, frame );
    } );

    this.scene.traverse(obj => {
      if (typeof obj.update === 'function') {
        obj.update(delta, now, frame);
      }
    });

    return this;
  }

  draw () {
    if ( defined( this.composer ) ) {
      this.composer.render( this.delta );
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    return this;
  }

  animate = nowMsec => {
    if (!this.running) return;
    this.stats.begin();
    window.requestAnimationFrame(this.animate);

    // measure time
    this.lastTimeMsec = this.lastTimeMsec || nowMsec - 1000 / 60;
    this.lastTimeMsec = nowMsec;
    this.delta = this.clock.getDelta();

    this.update( this.delta, nowMsec / 1000, this.frameCount );
    this.draw();
    this.emit('afterRender');
    this.frameCount++;

    if ( this._checkReady() ) this.emit('show');
    if ( this.frameCount === 2 ) this.emit('frame2');
    this.stats.end();
  }

  _checkReady() {
    // if ( this.dev && !this.shown ) this.log('frame', this.frameCount);
    return !this.shown && this.frameCount > 1 && this.physicsReady;
  }

  debug() {
    global.renderer = this.renderer;
    global.camera = this.camera;
    global.scene = this.scene;
    global.app = this;
    global.stats = this.stats;

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
    this.scene.traverse( function(c) { if ( c.name === '' )c.name = c.type; } );
  }

  start () {
    this.log( 'app start' );
    this._traverse('start');
    this.clock.getDelta();
    if ( this.dev && this.frameCount === 0 ) {
      this.debug();
    }
    this.stoppedDiv.style.display = 'none';

    if (this._rafID !== null) return;
    this._rafID = window.requestAnimationFrame(this.animate);
    this._running = true;
    return this;
  }

  stop () {
    this._traverse('stop');
    this.log( 'app stop' );
    if (this._rafID === null) return;
    window.cancelAnimationFrame(this._rafID);
    this._rafID = null;
    this._running = false;
    this.stoppedDiv.style.display = '';
    return this;
  }

  resize (width, height, pixelRatio) {
    // get default values
    this.log('resize');
    width = defined( width, this.viewport.clientWidth );
    height = defined(height, this.viewport.clientHeight );
    pixelRatio = defined(pixelRatio, Math.min(this.maxPixelRatio, window.devicePixelRatio));

    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    // update pixel ratio if necessary
    if (this.renderer.getPixelRatio() !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio);
    }

    // setup new size & update camera aspect if necessary
    defined( this.composer, this.renderer ).setSize(width, height);
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height;
    }
    this.camera.updateProjectionMatrix();

    this._traverse('onResize');

    // draw a frame to ensure the new size has been registered visually
    this.draw();
    return this;
  }

  setGpuInfo() {
    let renderString = '';

    if ( navigator.userAgent.includes('Apple') ) getRenderer( renderer => { renderString = renderer; } );

    this.gpuInfo = getGPUTier({
      glContext: this.renderer.getContext(), // Optionally pass in a WebGL context to avoid creating a temporary one internally
      mobileBenchmarkPercentages: [85, 13, 2, 1], // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
      desktopBenchmarkPercentages: [0, 50, 30, 20], // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
      forceRendererString: renderString, // (Development) Force a certain renderer string
      forceMobile: true // (Development) Force the use of mobile benchmarking scores
    });
    this.gpuInfo.tierNum = parseInt(this.gpuInfo.tier.slice(-1));
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

  exportGLTF( input, binary = true ) {
    exportGLTF( input, binary );
  }

  togglePause() {
    if ( this.running ) { this.stop(); } else { this.start(); }
  }

  onTouchStart( ev, pos ) {
    if ( defined( ev.touches, false ) && ev.touches.length ) {
      if ( ev.touches.length === 2 ) {
        this.hideOverlay();
      } else if ( ev.touches.length === 3 ) {
        this.toggleStats();
      } else if ( ev.touches.length === 4 && this.dev ) {
        this.togglePause();
      }
    }

    this._traverse('onTouchStart', ev, pos);
  }

  onTouchEnd( ev, pos ) {
    this._traverse('onTouchEnd', ev, pos);
  }

  onTouchMove( ev, pos ) {
    this._traverse('onTouchMove', ev, pos);
  }

  onKeydown( ev ) {
    if ( ev.altKey && this.aside !== null ) {
      ev.preventDefault();
      this.hideOverlay();
    }
    if ( ev.keyCode === 83 ) this.toggleStats();
    // dev key commands
    if ( this.dev || this.cargo ) {
      // toggle app run with space
      if ( ev.keyCode === 32 && ev.shiftKey ) {
        ev.preventDefault();
        this.togglePause();
      }
    }

    this._traverse('onKeydown', ev);
  }
  toggleStats() {
    const statsEl = this.stats.domElement;
    const statsVisible = statsEl.style.display === '';
    statsEl.style.display = statsVisible ? 'none' : '';
  }

  hideOverlay() {
    if ( this.cargo ) {
      this.aside.style.visibility = 'hidden';
      this.aside.style.display = 'none';
    } else {
      this.aside.style.visibility = (this.aside.style.visibility === 'hidden') ? 'visible' : 'hidden';
    }
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
  queueAssets() {
    this.log('queueAssets');
    this.assetManager.queue({
      url: SMAAEffect.searchImageDataURL,
      key: 'smaa-search',
      img: true
    });
    this.assetManager.queue({
      url: SMAAEffect.areaImageDataURL,
      key: 'smaa-area',
      img: true
    });

    this.assetManager.addProgressListener( progress => {
      this.log( 'assetManager progress:', progress );
      // this.onLoadProgress( {'manager': progress} );
    } );
    // this is how you would queue assets to be loaded
    // this.assetManager.queue({
    //   url: 'assets/audio/44/BlackShell_v2_BStem_left.mp3',
    //   key: 'BStem_left'
    // });
  }

  log() {
    // logging for debug only
    if ( this.dev || this.cargo ) {
      const css = 'background: #ff00ff; color: #ff00ff';
      const text = ' ';
      let cssArray = ['%c '.concat(text), css];
      var args = Array.prototype.slice.call(arguments);
      let final = cssArray.concat(args);
      console.log.apply(this, final);
    }
  }
};

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
