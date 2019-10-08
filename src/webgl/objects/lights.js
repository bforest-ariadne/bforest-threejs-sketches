const assign = require('object-assign');
const defined = require('defined');
let spotlightCount = 0;
let pointLightCount = 0;
const { assets } = require('../../context');

assets.queue({
  url: 'assets/textures/sprites/nova.png',
  key: 'lightSprite',
  texture: true
});

class SpotLight extends THREE.SpotLight {
  constructor ( parameters, {
    createMesh = true,
    castShadow = true,
    name = `pointlight${spotlightCount++}`
  } = {} ) {
    super( parameters );
    this.name = name;
    if ( castShadow ) {
      this.castShadow = castShadow;
      this.shadow.mapSize.width = 2048;
      this.shadow.mapSize.height = 2048;
      this.shadow.camera.near = 1;
      this.shadow.camera.far = 30;
      this.distance = 30;
    }
    if ( createMesh ) {
      this.mesh = createLightMesh();
      this.mesh.material.color = this.color;
      this.mesh.name = `${this.name}Mesh`;
      this.add( this.mesh );
    }
  }

  update() {
    if ( defined( this.mesh ) ) this.mesh.material.opacity = this.intensity;
  }
}

class PointLight extends THREE.PointLight {
  constructor ( parameters, {
    createMesh = true,
    castShadow = true,
    name = `pointlight${pointLightCount++}`
  } = {} ) {
    super( parameters );
    // parameters = assign({}, parameters);
    this.name = name;
    if ( castShadow ) {
      this.castShadow = castShadow;
      this.shadow.camera.near = 1;
      this.shadow.camera.far = 40;
    }
    if ( createMesh ) {
      this.mesh = createLightMesh();
      this.mesh.material.color = this.color;
      this.mesh.name = `${this.name}Mesh`;
      this.add( this.mesh );
    }
  }

  update() {
    if ( defined( this.mesh ) ) this.mesh.material.opacity = this.intensity;
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
