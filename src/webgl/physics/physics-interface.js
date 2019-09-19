var work = require('webworkify');
// const query = require('./util/query');

module.exports = class Physics {
  constructor( webgl, {
    rS,
    // max number of kinematic meshes
    Nmesh = 10,
    // max number of animated meshes
    NaniMesh = 3,
    // x and y particles
    Nx = 5,
    Ny = 5,
    // mesh arrays
    meshes = [],
    aniMeshes = [],
    vertices = [],
    clothGeometry,
    onReady = () => {}
  } = {} ) {
    // create data array
    let Nparticles = ( Nx + 1 ) * ( Ny + 1 );

    let positionsArray = new Float32Array( Nmesh * 3 );
    let quaternionsArray = new Float32Array( Nmesh * 4 );
    // array for particles
    let particlesArray = new Float32Array( Nparticles * 3 );
    // array for static bodies
    let sPositionsArray = new Float32Array( NaniMesh * 3 );
    let sQuaternionsArray = new Float32Array( NaniMesh * 4 );

    this.onReady = onReady;
    // this.onReady = opt.

    // create mesh arrays
    this.meshes = meshes;
    this.aniMeshes = aniMeshes;
    this.vertices = vertices;

    let dt = 1 / 60;
    this.cannonFrame = null;
    let useParticles = typeof clothGeometry !== 'undefined';
    let sendTime = 0;
    // let t = 0;
    let cloth = false;
    let clothMass = 2; // 1 kg in total
    let clothSize = 1; // 1 meter
    // let rest = clothSize / Nx;
    // let distMax = rest + (rest * 0.1); // 0.2

    // let clock = new THREE.Clock();
    this.onMessageCount = 0;

    // create worker
    this.worker = work(require('./physicsSim.js'));

    // worker onmessage
    this.worker.onmessage = e => {
      this.onMessageCount++;
      if ( this.onMessageCount === 3 ) this.onReady();
      positionsArray = new Float32Array( e.data.positionsArray );
      quaternionsArray = new Float32Array( e.data.quaternionsArray );

      particlesArray = new Float32Array( e.data.particlesArray );

      sPositionsArray = new Float32Array( e.data.sPositionsArray );
      sQuaternionsArray = new Float32Array( e.data.sQuaternionsArray );

      // t = e.data.t;
      cloth = e.data.cloth;
      this.cannonFrame = e.data.cannonFrame;

      // / this code updates the position of verticies from physics particles (no need for rotation)
      // Update cloth particles with update pos and quat from worker if "cloth" is true
      if ( cloth && useParticles ) {
        if (clothGeometry.isBufferGeometry) {
          clothGeometry.attributes.position.set( particlesArray );
        } else {
          let verticesLength = this.vertices.length;
          for ( let i = 0; i !== verticesLength; i++) {
            this.vertices[i].set( particlesArray[3 * i + 0],
              particlesArray[3 * i + 1],
              particlesArray[3 * i + 2] );
          }
        }
      }
      // this code updates the position and rotation of meshes from physics bodies
      let meshesLength = this.meshes.length;

      for ( let i = 0; i !== meshesLength; i++) {
        this.meshes[i].position.set( positionsArray[3 * i + 0],
          positionsArray[3 * i + 1],
          positionsArray[3 * i + 2] );
        this.meshes[i].quaternion.set(quaternionsArray[4 * i + 0],
          quaternionsArray[4 * i + 1],
          quaternionsArray[4 * i + 2],
          quaternionsArray[4 * i + 3]);
      }

      // this code updates non kinematic physics bodies with animation loop
      // fill positions and quaternions arrays with render loop updated values
      let aniMeshesLength = this.aniMeshes.length;
      for ( let i = 0; i !== aniMeshesLength; i++) {
        let m = this.aniMeshes[i];
        let p = m.position;
        let q = m.quaternion;
        sPositionsArray[3 * i + 0] = p.x;
        sPositionsArray[3 * i + 1] = p.y;
        sPositionsArray[3 * i + 2] = p.z;
        sQuaternionsArray[4 * i + 0] = q.x;
        sQuaternionsArray[4 * i + 1] = q.y;
        sQuaternionsArray[4 * i + 2] = q.z;
        sQuaternionsArray[4 * i + 3] = q.w;
      }

      // If the worker was faster than the time step (dt seconds), we want to delay the next timestep
      // var delay = this.delta * 1000 - (Date.now() - sendTime);
      var delay = dt * 1000 - (Date.now() - sendTime);
      if (delay < 0) {
        delay = 0;
      }
      // delay = 1;
      // console.log("delay: ", delay);
      setTimeout(sendDataToWorker, delay);
      // sendDataToWorker();
    };

    // send data functions
    // sends data to worker, this gets called once initially and then everytime a message is received from the worker
    let sendDataToWorker = () => {
      // console.log("test, sendDataToWorker");
      // ppo.logs("test", '+10', 'before: ', positionsArray);

      // console.log("mesagePosted");
      sendTime = Date.now();
      this.worker.postMessage({
        dt: dt,
        cloth: true,
        animate: true,
        positionsArray: positionsArray,
        quaternionsArray: quaternionsArray,
        particlesArray: particlesArray,
        sPositionsArray: sPositionsArray,
        sQuaternionsArray: sQuaternionsArray
      }, [positionsArray.buffer, quaternionsArray.buffer, particlesArray.buffer, sPositionsArray.buffer, sQuaternionsArray.buffer]);
    };

      // init physics worker
    var sendInitData = () => {
      sendTime = Date.now();
      this.worker.postMessage({
        Nx: Nx,
        Ny: Ny,
        cloth: cloth,
        clothSize: clothSize,
        clothMass: clothMass,
        init: true,
        dev: webgl.dev,
        scene: webgl.sceneName,
        positionsArray: positionsArray,
        quaternionsArray: quaternionsArray,
        particlesArray: particlesArray,
        sPositionsArray: sPositionsArray,
        sQuaternionsArray: sQuaternionsArray
      }, [positionsArray.buffer, quaternionsArray.buffer, particlesArray.buffer, sPositionsArray.buffer, sQuaternionsArray.buffer]);
    };
    sendInitData();
    // console.log(worker);
    // createCloth();

    var sendAnimData = () => {
      sendTime = Date.now();
      this.worker.postMessage({
        dt: 1 / 60,
        animate: true
      });
    };

    sendAnimData();
  }
  update( delta ) {
    this.delta = delta;
  }
};
