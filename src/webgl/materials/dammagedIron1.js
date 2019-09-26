const { assets } = require('../../context');

const ironAssets = [
  {
    url: 'assets/textures/notOpen/iron2_pbr/aorm.jpg',
    key: 'iron_aorm',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/iron2_pbr/Metal_DamagedIron_2k_n.jpg',
    key: 'iron_n',
    texture: true
  },
  // {
  //   url: 'assets/textures/notOpen/iron2_pbr/Metal_DamagedIron_2k_roughness.jpg',
  //   key: 'iron_r',
  //   texture: true
  // },
  // {
  //   url: 'assets/textures/notOpen/iron2_pbr/Metal_DamagedIron_2k_ao.jpg',
  //   key: 'iron_a',
  //   texture: true
  // },
  {
    url: 'assets/textures/notOpen/iron2_pbr/Metal_DamagedIron_2k_basecolor.jpg',
    key: 'iron_c',
    texture: true
  },
  {
    url: 'assets/textures/notOpen/iron2_pbr/Metal_DamagedIron_2k_h.jpg',
    key: 'iron_h',
    texture: true
  }];

const createIronMaterial = () => {
  const ironMaterial = new THREE.MeshStandardMaterial({
    // color: 0xffffff,
    roughness: 0.0,
    metalness: 1.0,
    roughnessMap: assets.get('iron_aorm'),
    metalnessMap: assets.get('iron_aorm'),
    normalMap: assets.get('iron_n'),
    aoMap: assets.get('iron_aorm'),
    map: assets.get('iron_c'),
    // displacementMap: assets.get('iron_h'),
    normalScale: new THREE.Vector2(1, 1),
    // envMap: env.target.texture,
    flatShading: false
  });
  // ironMaterial.needsUpdate = true
  return ironMaterial;
};

module.exports = { createIronMaterial, ironAssets };
