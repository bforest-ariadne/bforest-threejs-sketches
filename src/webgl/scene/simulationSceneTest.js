const { EventEmitter } = require('events');
const CANNON = require('../vendor/cannon.js');

module.exports = class SimulationSceneTest extends EventEmitter {
  constructor( opt = {} ) {
    super();

    this.bodies = opt.bodies;
    this.aniBodies = opt.aniBodies;
    this.world = opt.world;

    this.name = 'testScene';
    this.step = 0;
    this.ready = false;
    this.testVec = new CANNON.Vec3();

    var _this = this;

    // Contact Materials
    var clothMaterial = new CANNON.Material();
    clothMaterial.friction = 1.0;
    var sphereMaterial = new CANNON.Material();
    sphereMaterial.friction = 30.0;
    var clothSphereContactMaterial = new CANNON.ContactMaterial( clothMaterial,
      sphereMaterial,
      0.0, // friction coefficient
      0.0 // restitution
    );

    // Adjust constraint equation parameters for ground/ground contact
    clothSphereContactMaterial.contactEquationStiffness = 1e9;
    clothSphereContactMaterial.contactEquationRelaxation = 3;

    // Add contact material to the world
    this.world.addContactMaterial(clothSphereContactMaterial);

    // Create sphere
    var ballSize = 0.1;
    var sphereShape = new CANNON.Sphere(ballSize * 1.2);
    let sphereBody = new CANNON.Body({
      mass: 0,
      material: sphereMaterial
    });
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0, 0, 0);
    // this.world.addBody(sphereBody);
    // this.aniBodies.push( sphereBody );

    // Ground plane
    var plane = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(plane);
    groundBody.position.set(0, -2, 0);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);
    this.aniBodies.push( groundBody );

    // box
    var boxShape = new CANNON.Box( new CANNON.Vec3(0.15, 0.15, 0.15) );
    this.boxBody = new CANNON.Body({
      mass: 100,
      sleepSpeedLimit: 0.001
    });
    this.boxBody.addShape( boxShape );
    this.boxBody.position.set(0, 1.0, 0.3);
    // this.boxBody.velocity.set(10000, 0,0);
    this.world.addBody( this.boxBody );
    this.bodies.push( this.boxBody );

    // create hole
    let radius = 0.85;
    let height1 = 2;
    let holeBody = new CANNON.Body({ mass: 0 });
    let wallShape = new CANNON.Box( new CANNON.Vec3( radius, height1 * 0.5, radius * 0.1 * 0.5 ) );
    let wallPos1 = new CANNON.Vec3( 0, -2, radius );
    // holeBody.addShape( wallShape, wallPos1 );

    // wall bodies for debuggin position
    let wallBody0 = createWallBody(radius, (height1 * 0.5), (radius * 0.1 * 0.5), 0, (-0.5 * height1), radius );
    let wallBody1 = createWallBody(radius, (height1 * 0.5), (radius * 0.1 * 0.5), 0, (-0.5 * height1), -1 * radius );
    let wallBody2 = createWallBody( (radius * 0.1 * 0.5), (height1 * 0.5), radius, radius, (-0.5 * height1), 0 );
    let wallBody3 = createWallBody( (radius * 0.1 * 0.5), (height1 * 0.5), radius, -1 * radius, (-0.5 * height1), 0 );

    function createWallBody( sizeX, sizeY, sizeZ, posX, posY, posZ ) {
      let shape = new CANNON.Box( new CANNON.Vec3( sizeX, sizeY, sizeZ ) );
      let wallBody = new CANNON.Body( {
        mass: 0,
        shape: shape,
        position: new CANNON.Vec3( posX, posY, posZ )
      } );
      _this.world.addBody( wallBody );
      _this.bodies.push( wallBody );
      return wallBody;
    }

    this.ready = true;
  }

  update() {
    this.step++;
    // this.dt = dt;
  }
  onMessage( e ) {
    if ( e.data.animate ) {
      this.dt = e.data.dt;
      this.update();
    }
    if ( e.data.init ) {
      this.side = e.data.side;
    }
    if ( e.data.boxImpulse ) {
      let worldPoint = new CANNON.Vec3( 0, 0, 0 );
      let impulse = new CANNON.Vec3( this.dt, 0, 0 );
      if ( e.data.worldPoint ) {
        let dWPoint = e.data.dWPoint;
        worldPoint.set( dWPoint.x, dWPoint.y, dWPoint.z );
      }
      if ( e.data.impulse ) {
        let dImpulse = e.data.impulse;
        impulse.set( dImpulse.x * this.dt, dImpulse.y * this.dt, dImpulse.z * this.dt );
      }

      this.boxBody.applyImpulse( impulse, worldPoint );
    }
  }
};
