const { assets } = require('../../context');

const metal1Assets = [
  {
    url: 'assets/textures/notOpen/metalFloor1/metalFloor1_metallic.jpg',
    key: 'floor_m',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/metalFloor1/metalFloor1_n.jpg',
    key: 'floor_n',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/metalFloor1/metalFloor1_roughness.jpg',
    key: 'floor_r',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/metalFloor1/metalFloor1_ao.jpg',
    key: 'floor_a',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/metalFloor1/metalFloor1_basecolor.jpg',
    key: 'floor_c',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/metalFloor1/metalFloor1_h.jpg',
    key: 'floor_h',
    texture: true
  }];

const createMetal1Material = ( envMap ) => {
  const ironMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 1.0,
    roughnessMap: assets.get('floor_r'),
    metalnessMap: assets.get('floor_m'),
    normalMap: assets.get('floor_n'),
    aoMap: assets.get('floor_a'),
    map: assets.get('floor_c'),
    displacementMap: assets.get('floor_h'),
    // normalScale: new THREE.Vector2(0.1, 0.1),
    envMap: envMap,
    flatShading: true
  });

  const textures = [ ironMaterial.roughnessMap, ironMaterial.metalnessMap, ironMaterial.normalMap, ironMaterial.map, ironMaterial.aoMap, ironMaterial.displacementMap ];

  for ( let i in textures ) {
    textures[i].wrapS = THREE.RepeatWrapping;
    textures[i].wrapT = THREE.RepeatWrapping;
    textures[i].repeat = new THREE.Vector2( 10, 10 );
  }

  // ironMaterial.needsUpdate = true
  return ironMaterial;
};

module.exports = { createMetal1Material, metal1Assets };
