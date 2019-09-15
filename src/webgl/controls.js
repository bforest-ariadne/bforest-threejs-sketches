const { convertRange, clamp } = require('../util/utils');
const isMobile = require('../util/isMobile.js');
const { webgl } = require('../context');


module.exports = class Controls {
  constructor( dolly ) {

    this.controlDolly = new THREE.Group();
    this.controlDolly.name = 'controlDolly';
    webgl.scene.add( this.controlDolly );
    this.domElement = webgl.canvas;
    
    this.dolly = dolly;

    this.controls = new THREE.OrbitControls( this.controlDolly, this.domElement );
    this.controls.handleEvents = false;

    global.controls = this.controls;
    this.controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.25;

    this.controls.screenSpacePanning = false;

    this.controls.minDistance = 100;
    this.controls.maxDistance = 500;

    this.controls.enableZoom = false;

    this.controls.enableDamping = true;

    this.rotationTarget = 0;
    this.rotationV = 0;

    this.camRotDelta = 0;
    this.dollyRot = new THREE.Euler();

    if ( webgl.debug ) {
      var axis1 = new THREE.AxesHelper();
      axis1.name = 'axis';
      this.controlDolly.add(axis1);
    }

     this.controls.activateDeviceOrientation(true);
  }
  update () {
    this.controls.update();
    // this.dolly.rotation.y = this.dollyRot.y;
    this.dollyRot.copy(this.controlDolly.rotation);
    // this.dollyRot.x = this.dollyRot.x/2;
    // this.dollyRot.x = 0;
    // this.dollyRot.y = this.dollyRot.y/2
    // this.dollyRot.z = 0;
    // this.dolly.rotation.copy(this.dollyRot);
    var q = new THREE.Quaternion();
    q.setFromEuler(this.dollyRot);
    this.dolly.rotation.setFromQuaternion(q);
  }
}