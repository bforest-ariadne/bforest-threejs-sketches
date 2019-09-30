// taken from https://gist.github.com/mattdesl/2ee82157a86962347dedb6572142df7c
const glslify = require('glslify');
const path = require('path');
const assign = require('object-assign');
const defined = require('defined');

// This is the original source, we will copy + paste it for our own GLSL
// const vertexShader = THREE.ShaderChunk.meshphysical_vert;
// const fragmentShader = THREE.ShaderChunk.meshphysical_frag;

// Our custom shaders
const fragmentShader = glslify(path.resolve(__dirname, '../shaders/ice.frag'));
const vertexShader = glslify(path.resolve(__dirname, '../shaders/ice.vert'));

module.exports = IceMaterial;
function IceMaterial (parameters) {
  parameters = assign({}, parameters);
  THREE.MeshStandardMaterial.call(this);
  this.uniforms = assign({},
    THREE.ShaderLib.standard.uniforms,
    {
      // your custom uniforms or overrides to built-ins
      time: { type: 'f', value: 0 },
      thicknessMap: { type: 't', value: parameters.thicknessMap || new THREE.Texture() },
      thicknessRepeat: { type: 'v3', value: parameters.thicknessRepeat || new THREE.Vector2() },
      thicknessPower: { type: 'f', value: 20 },
      thicknessScale: { type: 'f', value: 4 },
      thicknessDistortion: { type: 'f', value: 0.185 },
      thicknessAmbient: { type: 'f', value: 0.0 },
    }
  );
  setFlags(this);
  this.setValues(parameters);
}

IceMaterial.prototype = Object.create(THREE.MeshStandardMaterial.prototype);
IceMaterial.prototype.constructor = IceMaterial;
IceMaterial.prototype.isMeshStandardMaterial = true;

IceMaterial.prototype.copy = function (source) {
  THREE.MeshStandardMaterial.prototype.copy.call(this, source);
  this.uniforms = THREE.UniformsUtils.clone(source.uniforms);
  setFlags(this);
  return this;
};

function setFlags (material) {
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  material.type = 'IceMaterial';
}