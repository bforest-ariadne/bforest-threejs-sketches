const { assets } = require('../../context');

const ironAssets = [
  {
    url: 'assets/textures/iron1_pbr/Metal_DamagedIron_2k_metallic.jpg',
    key: 'iron_m',
    texture: true
  },
  {
    url: 'assets/textures/iron1_pbr/Metal_DamagedIron_2k_n.jpg',
    key: 'iron_n',
    texture: true
  },
  {
    url: 'assets/textures/iron1_pbr/Metal_DamagedIron_2k_roughness.jpg',
    key: 'iron_r',
    texture: true
  },
  {
    url: 'assets/textures/iron1_pbr/Metal_DamagedIron_2k_ao.jpg',
    key: 'iron_a',
    texture: true
  },
  {
    url: 'assets/textures/iron1_pbr/Metal_DamagedIron_2k_basecolor.jpg',
    key: 'iron_c',
    texture: true
  },
  {
    url: 'assets/textures/iron1_pbr/Metal_DamagedIron_2k_h.jpg',
    key: 'iron_h',
    texture: true
  }];

const createIronMaterial = () => {
  const ironMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 1.0,
    roughnessMap: assets.get('iron_r'),
    metalnessMap: assets.get('iron_m'),
    normalMap: assets.get('iron_n'),
    aoMap: assets.get('iron_a'),
    map: assets.get('iron_c'),
    displacement: assets.get('iron_h'),
    normalScale: new THREE.Vector2(0.1, 0.1),
    // envMap: env.target.texture,
    flatShading: true
  });
  // ironMaterial.needsUpdate = true
  return ironMaterial;
};

module.exports = { createIronMaterial, ironAssets };
