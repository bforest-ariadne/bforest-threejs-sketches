// taken from https://gist.github.com/mattdesl/2ee82157a86962347dedb6572142df7c
const glslify = require('glslify');
const path = require('path');
const assign = require('object-assign');
// const defined = require('defined');

// This is the original source, we will copy + paste it for our own GLSL
// const vertexShader = THREE.ShaderChunk.meshphysical_vert;
// const fragmentShader = THREE.ShaderChunk.meshphysical_frag;

// Our custom shaders
const fragmentShader = glslify(path.resolve(__dirname, '../shaders/ice.frag'));
const vertexShader = glslify(path.resolve(__dirname, '../shaders/ice.vert'));

class IceMaterial extends THREE.MeshStandardMaterial {
  constructor (parameters) {
    parameters = assign({}, parameters);
    super();
    this.uniforms = assign({},
      THREE.ShaderLib.standard.uniforms,
      {
        // your custom uniforms or overrides to built-ins
        thicknessMap: { type: 't', value: parameters.thicknessMap || new THREE.Texture() },
        thicknessRepeat: { type: 'v3', value: parameters.thicknessRepeat || new THREE.Vector2() },
        thicknessPower: { type: 'f', value: 20 },
        thicknessScale: { type: 'f', value: 4 },
        thicknessDistortion: { type: 'f', value: 0.185 },
        thicknessAmbient: { type: 'f', value: 0.0 },
        thicknessAttenuation: { type: 'f', value: 0.8 },
        thicknessColor: { type: 'v3', value: parameters.thicknessColor || new THREE.Color('white') }
      }
    );
    setFlags(this);
    this.setValues(parameters);
    this.isMeshStandardMaterial = true;
  }

  copy( source ) {
    super.copy( source );
    this.uniforms = THREE.UniformsUtils.clone(source.uniforms);
    setFlags(this);
    return this;
  }

  get thicknessColorStyle() {
    return this.uniforms.thicknessColor.value.getHexString();
  }

  set thicknessColorStyle( value ) {
    // console.log('set hex', value );
    this.uniforms.thicknessColor.value.setStyle( value );
  }

  get thicknessMap() {
    return this.uniforms.thicknessMap.value;
  }

  set thicknessMap( value ) {
    this.uniforms.thicknessMap.value = value;
    this.needsUpdate = true;
  }
}

function setFlags (material) {
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  material.type = 'IceMaterial';
}

module.exports = IceMaterial;
