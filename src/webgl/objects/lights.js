const assign = require('object-assign');
const defined = require('defined');
let spotlightCount = 0;
let pointLightCount = 0;
const { assets } = require('../../context');

assets.queue({
  url: 'assets/textures/sprites/nova.png',
  cargoUrl: 'https://files.cargocollective.com/c521688/nova.png',
  key: 'lightSprite',
  texture: true
});

class SpotLight extends THREE.SpotLight {
  constructor ({
    color = 0xffffff,
    intensity = 10,
    distance = 0,
    angle = Math.PI / 2,
    penumbra = 0,
    decay = 1,
    createMesh = true,
    castShadow = true,
    shadowMapSize = 2048,
    shadowCameraNear = 1,
    shadowCameraFar = 30,
    meshSize = 2,
    position = new THREE.Vector3(),
    name = `spotLight${spotlightCount++}`
  } = {} ) {
    super( color, intensity, distance, angle, penumbra, decay );
    this.name = name;
    this.position.copy( position );
    if ( castShadow ) {
      this.castShadow = castShadow;
      this.shadow.mapSize.width = shadowMapSize;
      this.shadow.mapSize.height = shadowMapSize;
      this.shadow.camera.near = shadowCameraNear;
      this.shadow.camera.far = shadowCameraFar;
    }
    if ( createMesh ) {
      this.mesh = createLightMesh();
      this.mesh.material.color = this.color;
      // TODO: make material.size scale with some paramater of the light like distance?
      this.mesh.material.size = meshSize;
      this.mesh.name = `${this.name}Mesh`;
      this.add( this.mesh );
    }
  }

  update() {
    if ( defined( this.mesh ) ) this.mesh.material.opacity = this.intensity;
  }
}

class PointLight extends THREE.PointLight {
  constructor ({
    color = 0xffffff,
    intensity = 1,
    distance = 0,
    decay = 2,
    createMesh = true,
    castShadow = true,
    shadowMapSize = 2048,
    shadowCameraNear = 1,
    shadowCameraFar = 30,
    meshSize = 2,
    position = new THREE.Vector3(),
    name = `pointlight${pointLightCount++}`
  } = {} ) {
    super( color, intensity, distance, decay );
    // parameters = assign({}, parameters);
    this.name = name;
    this.position.copy( position );
    if ( castShadow ) {
      this.castShadow = castShadow;
      this.shadow.mapSize.width = shadowMapSize;
      this.shadow.mapSize.height = shadowMapSize;
      this.shadow.camera.near = shadowCameraNear;
      this.shadow.camera.far = shadowCameraFar;
    }
    if ( createMesh ) {
      this.mesh = createLightMesh();
      this.mesh.material.color = this.color;
      // this.mesh.material.color.multiplyScalar( intensity );
      this.mesh.material.size = meshSize;
      this.mesh.name = `${this.name}Mesh`;
      this.add( this.mesh );
    }
  }

  update() {
    if ( defined( this.mesh ) ) this.mesh.material.opacity = (this.intensity);
  }
}

function createLightMesh() {
  const pointGeo = new THREE.BufferGeometry();
  pointGeo.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0 ], 3 ) );
  const pointMesh = new THREE.Points(
    pointGeo,
    new THREE.PointsMaterial({
      size: 2,
      map: assets.get('lightSprite'),
      sizeAttenuation: true,
      alphaTest: 0.0,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
  );
  pointMesh.material.onBeforeCompile = ( shader, renderer ) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <map_particle_fragment>`,
      `
      #include <map_particle_fragment>
      diffuseColor.a = diffuseColor.r * opacity;
      `
    );
  };
  return pointMesh;
}

module.exports = { SpotLight, PointLight };
