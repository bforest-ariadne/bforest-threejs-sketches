global.THREE = require('three');

// include any additional ThreeJS vendor libraries here
require('three/examples/js/loaders/GLTFLoader.js');
require('three/examples/js/ShaderSkin.js');
require('three/examples/js/shaders/BleachBypassShader.js');
require('three/examples/js/shaders/ConvolutionShader.js');
require('three/examples/js/shaders/CopyShader.js');
require('three/examples/js/postprocessing/EffectComposer.js');
require('three/examples/js/postprocessing/RenderPass.js');
require('three/examples/js/postprocessing/BloomPass.js');
require('three/examples/js/postprocessing/TexturePass.js');
require('three/examples/js/postprocessing/ShaderPass.js');
require('three/examples/js/postprocessing/MaskPass.js');
require('three/examples/js/WebGL.js');

// require('three/examples/js/controls/DeviceOrientationControls.js');
require('./vendor/DeviceOrientation+OrbitControls.js');

require('three/examples/js/loaders/GLTFLoader.js');


// ensure context is loaded before entry
require('./context');

// now start up WebGL app
require('./startup')();