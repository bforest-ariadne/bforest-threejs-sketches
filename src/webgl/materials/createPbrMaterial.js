const { assets } = require('../../context');

// example import this material
// const { createMaterial, materialAssets } = require('../materials/marbleFloor');

// example load assets
// for ( let i in materialAssets ) {
//   assets.queue( materialAssets[i] );
// }

const materialAssets = [
  {
    url: 'assets/textures/notOpen/marbleFloor1/aorm.jpg',
    key: 'floor_aorm',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/marbleFloor1/marbleFloor1_n.jpg',
    key: 'floor_n',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/marbleFloor1/marbleFloor1_basecolor.jpg',
    key: 'floor_c',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/marbleFloor1/marbleFloor1_h.jpg',
    key: 'floor_h',
    texture: true
  }];

const createMaterial = ( envMap ) => {
  const material = new THREE.MeshStandardMaterial({
    // color: 0xffffff,
    // roughness: 1.0,
    // metalness: 1.0,
    roughnessMap: assets.get('floor_aorm'),
    metalnessMap: assets.get('floor_aorm'),
    normalMap: assets.get('floor_n'),
    aoMap: assets.get('floor_aorm'),
    map: assets.get('floor_c'),
    // displacementMap: assets.get('floor_h'),
    // normalScale: new THREE.Vector2(0.1, 0.1),
    envMap: envMap,
    flatShading: true
  });

  const textures = [ material.roughnessMap, material.metalnessMap, material.normalMap, material.map, material.aoMap ];

  for ( let i in textures ) {
    textures[i].wrapS = THREE.RepeatWrapping;
    textures[i].wrapT = THREE.RepeatWrapping;
    textures[i].repeat = new THREE.Vector2( 4, 4 );
  }

  // material.needsUpdate = true
  return material;
};

module.exports = { createMaterial, materialAssets };
