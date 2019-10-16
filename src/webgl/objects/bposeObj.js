const { webgl, assets } = require('../../context');

const bPoseObjAssets = [
  {
    url: 'assets/models/bpose1_v1.glb',
    key: 'bpose'
  },
  {
    url: 'assets/models/bpose1_NORM.jpg',
    key: 'bpose_n',
    texture: true
  },
  {
    url: 'assets/models/bpose1_AO.png',
    key: 'bpose_c',
    texture: true
  },
  {
    url: 'assets/models/bpose1_THICK.jpg',
    key: 'bpose_thick',
    texture: true
    // flipY: false
  }
];

class BPoseObj extends THREE.Mesh {
  constructor() {
    const gltf = assets.get('bpose');
    let geometry, material;
    gltf.scene.traverse(child => {
      if (child.isMesh && child.geometry) {
        geometry = child.geometry;
      }
    });
    const normalMap = assets.get('bpose_n');
    const colorMap = assets.get('bpose_c');

    material = new THREE.MeshStandardMaterial({
      // map: colorMap,
      normalMap: normalMap
    });
    super( geometry, material );
    this.name = 'bposeObj';

    // const self = this;
    // // now fetch the loaded resource
    // const gltf = assets.get('bpose');
    // const normalMap = assets.get('bpose_n');
    // const colorMap = assets.get('bpose_c');

    // this.material = new THREE.MeshStandardMaterial({
    //   map: colorMap,
    //   normalMap: normalMap
    // });

    // this.group.position.set(0.38, -0.88, -1.18);
    this.rotation.set(0, -3.5, 0);

    // if (webgl.dev) global.group = this.group;

    // // Replaces all meshes material with something basic
    // gltf.scene.traverse(child => {
    //   if (child.isMesh) {
    //     child.material = this.material;
    //     // ThreeJS attaches something odd here on GLTF ipmport
    //     child.onBeforeRender = () => {};
    //     child.scale.setScalar(0.2);

    //     // self.bpose = child;
    //     self.add(child);
    //   }
    // });
  }
}

module.exports = { BPoseObj, bPoseObjAssets };
