const { assets } = require('../../context');

// example import this material
// const { createMaterial, materialAssets } = require('../materials/marbleFloor');

// example load assets
// for ( let i in materialAssets ) {
//   assets.queue( materialAssets[i] );
// }

const folder = 'gold1';

const materialAssets = [
  {
    url: `assets/textures/${folder}/aorm.jpg`,
    key: 'aorm',
    texture: true
  },
  {
    url: `assets/textures/${folder}/normal.jpg`,
    key: 'n',
    texture: true
  },
  {
    url: `assets/textures/${folder}/basecolor.jpg`,
    key: 'c',
    texture: true
  }
  // {
  //   url: `assets/textures/notOpen/marbleFloor1/marbleFloor1_h.jpg`,
  //   key: 'h',
  //   texture: true
  // }
];

const createMaterial = ( envMap ) => {
  const material = new THREE.MeshStandardMaterial({
    // color: 0xffffff,
    roughness: 0.99,
    // metalness: 1.0,
    roughnessMap: assets.get('aorm'),
    metalnessMap: assets.get('aorm'),
    normalMap: assets.get('n'),
    aoMap: assets.get('aorm'),
    map: assets.get('c'),
    // displacementMap: assets.get('h'),
    // normalScale: new THREE.Vector2(0.1, 0.1),
    envMap: envMap,
    flatShading: true,
    name: folder
  });

  const textures = [ material.roughnessMap, material.metalnessMap, material.normalMap, material.map, material.aoMap ];

  for ( let i in textures ) {
    // textures[i].wrapS = THREE.RepeatWrapping;
    // textures[i].wrapT = THREE.RepeatWrapping;
    // textures[i].repeat = new THREE.Vector2( 1, 1 );
  }

  // material.needsUpdate = true
  return material;
};

module.exports = { createMaterial, materialAssets };
