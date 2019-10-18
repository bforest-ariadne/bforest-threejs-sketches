const { webgl } = require('../../context');

module.exports = class CubeMapDebugger extends THREE.Group {
  constructor() {
    super();
    this.name = 'cubeMapDebugger';
    this.matrixAutoUpdate = false;
    this.planes = [];
    if ( webgl.camera && webgl.camera.children.length === 0 && webgl.camera.getObjectByName('camTarget') === undefined ) {
      const camTarget = new THREE.Object3D();
      camTarget.name = 'camTarget';
      camTarget.position.z = -1;
      webgl.camera.add( camTarget );
    }
    this.camTarget = webgl.camera.getObjectByName('camTarget');
    this.targetWorldPosition = new THREE.Vector3();
    this.camTarget.getWorldPosition( this.targetWorldPosition );
    for ( let cubeMap of Object.values( arguments ) ) {
      if ( !( cubeMap instanceof THREE.Texture ) ) {
        console.warn( 'cubeDebugger arguments must be type THREE.Texture');
        return;
      }
      const plane = new THREE.Sprite( new THREE.SpriteMaterial( { map: cubeMap } ) );
      plane.scale.multiplyScalar( 0.1 );
      plane.position.y = -0.3 + ( this.planes.length * 0.1 );
      this.planes.push( plane );
      this.add( plane );
    }
  }

  update() {
    if ( !this.camTarget && this.planes.length === 0 ) return;
    // this.camTarget.getWorldPosition( this.targetWorldPosition );
    // this.position.copy( this.targetWorldPosition );
    this.camTarget.updateMatrixWorld();
    this.matrix = this.camTarget.matrixWorld;

  }
}
;