const { assets } = require('../../context');

// example import this material
// const { createMaterial, materialAssets } = require('../materials/marbleFloor');

// example load assets
// for ( let i in materialAssets ) {
//   assets.queue( materialAssets[i] );
// }

const folder = 'Tiles32';

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
  },
  // {
  //   url: `assets/textures/${folder}/mask.jpg`,
  //   key: 'mask',
  //   texture: true
  // },
  {
    url: `assets/textures/${folder}/height.jpg`,
    key: 'h',
    texture: true
  }
];

const createMaterial = ( envMap ) => {
  const material = new THREE.MeshPhysicalMaterial({
    // color: 0xffffff,
    roughness: 1,
    metalness: 1,
    roughnessMap: assets.get('aorm'),
    metalnessMap: assets.get('aorm'),
    normalMap: assets.get('n'),
    aoMap: assets.get('aorm'),
    map: assets.get('c'),
    // alphaMap: assets.get('mask'),
    // transparent: true,
    // displacementMap: assets.get('h'),
    // normalScale: new THREE.Vector2(-1, -1),
    // bumpMap: assets.get('h'),
    envMap: envMap,
    flatShading: true,
    name: folder
  });

  // const textures = [ material.roughnessMap, material.metalnessMap, material.normalMap, material.map, material.aoMap ];
  const textures = [];

  for ( let [ key, value ] of Object.entries( material ) ) {
    if ( value instanceof THREE.Texture ) {
      if ( !textures.includes(value) && !value.name.includes('cube') ) textures.push(value);
    }
  }

  for ( let i in textures ) {
    textures[i].anisotropy = 1;
    // textures[i].wrapS = THREE.RepeatWrapping;
    // textures[i].wrapT = THREE.RepeatWrapping;
    // textures[i].repeat = new THREE.Vector2( 0.5, 0.5 );
  }

  // material.needsUpdate = true
  return material;
};

module.exports = { createMaterial, materialAssets };
