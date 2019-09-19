const CANNON = require('../../vendor/cannon');
const SimulationSceneTest = require( '../scene/simulationSceneTest' );
const defined = require('defined');

module.exports = function ( self ) {
  var world;
  var timeBias = 1;
  var cloth = false;

  var particles = [];
  var aniBodies = [];
  var bodies = [];

  var worldPause = false;
  var dt;

  var sendTime = 0;
  var firstFrame = true;
  var cannonFrame;
  let dev = false;
  self.this = this;
  var scene;

  var sPositionsArray, sQuaternionsArray, positionsArray, quaternionsArray, particlesArray;

  function init(e) {
    log('workerInit');
    dev = e.data.dev;
    self.dev = dev;

    // init cannon world
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity.set(0, -0.1, 0);
    world.solver.iterations = 2;
    // world.allowSleep = true;

    positionsArray = e.data.positionsArray;
    quaternionsArray = e.data.quaternionsArray;
    particlesArray = e.data.particlesArray;
    sPositionsArray = e.data.sPositionsArray;
    sQuaternionsArray = e.data.sQuaternionsArray;

    let scene = e.data.scene;
    if ( scene === 'test' ) {
      scene = new SimulationSceneTest({
        bodies: bodies,
        aniBodies: aniBodies,
        world: world
      });
    } else {
      // TODO: put empty scene here
      scene = new SimulationSceneTest({
        bodies: bodies,
        aniBodies: aniBodies,
        world: world
      });
    }

    scene.onMessage( e );

    if ( dev ) setupDev();
  }

  function animate(e) {
    // Step the world

    dt = e.data.dt;
    if (!worldPause) {
      world.step(dt * timeBias);
      // world.step(1/30);
    }

    var t = world.time;

    // copy over the pos and quat array from the main thread

    if (!firstFrame) {
      positionsArray = e.data.positionsArray;
      quaternionsArray = e.data.quaternionsArray;
      particlesArray = e.data.particlesArray;
      sPositionsArray = e.data.sPositionsArray;
      sQuaternionsArray = e.data.sQuaternionsArray;
    } else {
      log('worker first frame');
    }

    // replace values in the pos and quat array with world updated pos and quat
    for (let i = 0; i !== bodies.length; i++) {
      let b = bodies[i];
      let p = b.position;
      let q = b.quaternion;
      positionsArray[3 * i + 0] = p.x;
      positionsArray[3 * i + 1] = p.y;
      positionsArray[3 * i + 2] = p.z;
      quaternionsArray[4 * i + 0] = q.x;
      quaternionsArray[4 * i + 1] = q.y;
      quaternionsArray[4 * i + 2] = q.z;
      quaternionsArray[4 * i + 3] = q.w;
    }

    // copy over the particle array from main thread.

    // we have to do this because transferable objects are no longer available after transmission

    if (cloth) {
      for (let i in particles) {
        var p = particles[i].position;
        particlesArray[3 * i + 0] = p.x;
        particlesArray[3 * i + 1] = p.y;
        particlesArray[3 * i + 2] = p.z;
      }
    }

    // update pos and quat of meshes animated in render loop

    for (let i = 0; i !== aniBodies.length; i++) {
      aniBodies[i].position.set( sPositionsArray[3 * i + 0],
        sPositionsArray[3 * i + 1],
        sPositionsArray[3 * i + 2] );
      aniBodies[i].quaternion.set(sQuaternionsArray[4 * i + 0],
        sQuaternionsArray[4 * i + 1],
        sQuaternionsArray[4 * i + 2],
        sQuaternionsArray[4 * i + 3]);
    }

    cannonFrame = Date.now() - sendTime;

    sendTime = Date.now();

    // Send data back to the main thread //the brackets are our transferable objects. supposed to be super fast, fuck if I know.
    self.postMessage({
      positionsArray: positionsArray,
      quaternionsArray: quaternionsArray,
      particlesArray: particlesArray,
      sPositionsArray: sPositionsArray,
      sQuaternionsArray: sQuaternionsArray,
      t: t,
      cloth: cloth,
      cannonFrame: cannonFrame
    }, [positionsArray.buffer,
      quaternionsArray.buffer,
      particlesArray.buffer,
      sPositionsArray.buffer,
      sQuaternionsArray.buffer ]);

    firstFrame = false;
    if ( dev ) {
      global.positionsArray = positionsArray;
    }
  }

  function setupDev() {
    self.world = world;
    global.bodies = bodies;
    global.positionsArray = positionsArray;
    global.CANNON = CANNON;
    global.scene = scene;
  }

  function log() {
    // logging for debug only
    if ( self.dev ) {
      const css = 'background: #00ffff;';
      const text = ' ';
      let cssArray = ['%c '.concat(text), css];
      var args = Array.prototype.slice.call(arguments);
      let final = cssArray.concat(args);
      console.log.apply(this, final);
    }
  }

  self.onmessage = function(e) {
    // if world pause received, pause the works
    if (e.data.worldPause) {
      worldPause = true;
    }

    // if world resume message received, resume the world
    if (e.data.worldResume) {
      worldPause = false;
    }

    if (e.data.worldBodies) {
      log('world.bodies: ', world.bodies);
    }
    if (e.data.clothDamp) {
      for (let i in particles) {
        particles[i].linearDamping = e.data.clothDamp;
      }
    }
    if (e.data.clothMassUpdate) {
      for (let i in particles) {
        particles[i].mass = e.data.clothMass;
        particles[i].updateMassProperties();
      }
    }

    if (e.data.worldBodiesPos) {
      for (let i in world.bodies) {
        log('world.bodies: ', i, world.bodies[i].position);
      }
    }

    // this initializes everything and gets run on the first message only
    if (e.data.init && !world) {
      init(e);
    }

    // this code gets run every time a message is received. It is the update function.
    if (e.data.animate && world) {
      animate(e);
    }
    if ( defined( scene ) ) scene.onMessage( e );
  };
};
