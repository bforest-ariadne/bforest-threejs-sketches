const { webgl, assets } = require('../../context');

const bPoseObjAssets = [
  {
    url: 'assets/models/bpose1_v1.glb',
    key: 'bpose'
  },
  {
    url: 'assets/models/bpose1_NORM.jpg',
    key: 'normalmap',
    texture: true
  },
  {
    url: 'assets/models/bpose1_AO.png',
    key: 'colormap',
    texture: true
  }];

class BPoseObj extends THREE.Object3D {
  constructor() {
    super();
    this.name = 'bposeObj';

    const self = this;
    // now fetch the loaded resource
    const gltf = assets.get('bpose');
    const normalMap = assets.get('normalmap');
    const colorMap = assets.get('colormap');

    this.material = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap
    });

    // this.group.position.set(0.38, -0.88, -1.18);
    this.rotation.set(0, -3.5, 0);

    if (webgl.dev) global.group = this.group;

    // Replaces all meshes material with something basic
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        child.material = this.material;
        // ThreeJS attaches something odd here on GLTF ipmport
        child.onBeforeRender = () => {};
        child.scale.setScalar(0.2);

        // self.bpose = child;
        self.add(child);
      }
    });
  }
}

module.exports = { BPoseObj, bPoseObjAssets };
