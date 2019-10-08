// const defined = require('defined');
let groundCount = 0;

module.exports = class Ground extends THREE.Mesh {
  constructor ({
    geometry = null,
    material = new THREE.MeshStandardMaterial({
      metalness: 0,
      roughness: 1
    }),
    size = 100,
    segments = 2,
    receiveShadow = true,
    height = 0,
    position = new THREE.Vector3(),
    name = `ground${groundCount++}`
  } = {} ) {
    geometry = geometry === null ? new THREE.PlaneBufferGeometry( size, size, segments, segments ) : geometry;
    super( geometry, material );
    this.name = name;
    position.y = height;
    this.position.copy( position );
    this.rotation.x = -Math.PI / 2;
    this.receiveShadow = receiveShadow;
  }

  // update() {
  //   if ( defined( this.mesh ) ) this.mesh.material.opacity = this.intensity;
  // }
};
