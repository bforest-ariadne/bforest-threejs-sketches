global.THREE = require('three');

// include any additional ThreeJS vendor libraries here
require('three/examples/js/loaders/GLTFLoader.js');
// require('./vendor/GLTFLoader');
// require('./vendor/BasisTextureLoader');
require( 'three/examples/js/misc/GPUComputationRenderer' );
// require('three/examples/js/loaders/BasisTextureLoader');
require('three/examples/js/loaders/HDRCubeTextureLoader.js');
require('three/examples/js/loaders/RGBELoader.js');
require('three/examples/js/pmrem/PMREMGenerator.js');
require('three/examples/js/pmrem/PMREMCubeUVPacker.js');
require('three/examples/js/shaders/UnpackDepthRGBAShader');
require('three/examples/js/utils/ShadowMapViewer.js');
require('three/examples/js/exporters/GLTFExporter');
require('three/examples/js/controls/OrbitControls');
// require('three/examples/js/utils/BufferGeometryUtils');
// require('three/examples/js/ShaderSkin.js');
// require('three/examples/js/shaders/BleachBypassShader.js');
// require('three/examples/js/shaders/ConvolutionShader.js');
// require('three/examples/js/shaders/CopyShader.js');
// require('three/examples/js/postprocessing/EffectComposer.js');
// require('three/examples/js/postprocessing/RenderPass.js');
// require('three/examples/js/postprocessing/BloomPass.js');
// require('three/examples/js/postprocessing/TexturePass.js');
// require('three/examples/js/postprocessing/ShaderPass.js');
// require('three/examples/js/postprocessing/MaskPass.js');
require('three/examples/js/WebGL.js');

// require('three/examples/js/controls/DeviceOrientationControls.js');
// require('./vendor/DeviceOrientation+OrbitControls.js');

window.addEventListener('load', () => {
  // ensure context is loaded before entry
  require('./context');

  // now start up WebGL app
  require('./startup')();
});
