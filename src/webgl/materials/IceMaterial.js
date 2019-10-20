// adapted IceMaterial by @Mattdesl https://gist.github.com/mattdesl/2ee82157a86962347dedb6572142df7c
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

class IceMaterial extends THREE.MeshPhysicalMaterial {
  constructor (parameters) {
    parameters = assign({}, parameters);
    super();
    this._useTranslucency = true;
    this.defines['USE_TRANSLUCENCY'] = '';
    if ( defined( parameters.thicknessMap, false) ) this.defines['USE_THICKNESS_MAP'] = '';
    if ( parameters.parallaxLayer1 ) {
      this.defines['USE_PARALLAX_LAYER_1'] = '';
      setTextureWrapRepeat( parameters.parallaxLayer1 );
      }
    if ( parameters.parallaxLayer2 ) {
      this.defines['USE_PARALLAX_LAYER_2'] = '';
      setTextureWrapRepeat( parameters.parallaxLayer2 );
      }
    if ( parameters.parallaxLayer3 ) {
      this.defines['USE_PARALLAX_LAYER_3'] = '';
      setTextureWrapRepeat( parameters.parallaxLayer3 );
      }
    if ( parameters.parallaxLayer1 || parameters.parallaxLayer2 || parameters.parallaxLayer3 ) this.defines['USE_PARALLAX_LAYER'] = '';
    if ( parameters.parallaxUv3 ) this.defines['PARALLAX_UV3'] = '';
    this.uniforms = assign({},
      THREE.ShaderLib.physical.uniforms,
      {
        // your custom uniforms or overrides to built-ins
        thicknessMap: { type: 't', value: parameters.thicknessMap || null },
        thicknessRepeat: { type: 'v2', value: parameters.thicknessRepeat || new THREE.Vector2( 1, 1 ), min: 0, max: 10 },
        thicknessPower: { type: 'f', value: parameters.thicknessPower || 20, min: 0, max: 100 },
        thicknessScale: { type: 'f', value: parameters.thicknessScale || 4, min: 0, max: 100 },
        thicknessDistortion: { type: 'f', value: parameters.thicknessDistortion || 0.185, min: 0, max: 1 },
        thicknessAmbient: { type: 'f', value: parameters.thicknessAmbient || 0.0, min: 0, max: 1 },
        thicknessAttenuation: { type: 'f', value: parameters.thicknessAttenuation || 0.8, min: 0, max: 1 },
        diffuseColorInfluence: { type: 'f', value: parameters.diffuseColorInfluence || 1.0, min: 0, max: 1 },
        thicknessIOR: { type: 'f', value: parameters.thicknessIOR || 1.0, min: 0, max: 2 },
        thicknessColor: { type: 'v3', value: parameters.thicknessColor || new THREE.Color('white') },
        parallaxScale1: { type: 'f', value: parameters.parallaxScale1 || 1.0, min: 0, max: 10 },
        parallaxLayer1: { type: 't', value: parameters.parallaxLayer1 || null },
        parallaxScale2: { type: 'f', value: parameters.parallaxScale2 || 1.0, min: 0, max: 10 },
        parallaxLayer2: { type: 't', value: parameters.parallaxLayer2 || null },
        parallaxScale3: { type: 'f', value: parameters.parallaxScale3 || 1.0, min: 0, max: 10 },
        parallaxLayer3: { type: 't', value: parameters.parallaxLayer3 || null }
      }
    );
    setFlags(this);
    this.setValues(parameters);
    this.isMeshStandardMaterial = true;

    function setTextureWrapRepeat( texture ) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
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
  
  get parallaxLayer1() {
    return this.uniforms.parallaxLayer1.value;
  }

  set parallaxLayer1( value ) {
    this.uniforms.parallaxLayer1.value = value;
    this.needsUpdate = true;
  }

  get parallaxLayer2() {
    return this.uniforms.parallaxLayer2.value;
  }

  set parallaxLayer2( value ) {
    this.uniforms.parallaxLayer2.value = value;
    this.needsUpdate = true;
  }

  get thicknessRepeat() {
    return this.uniforms.thicknessRepeat.value;
  }

  set thicknessRepeat( value ) {
    this.uniforms.thicknessColor.value = value;
  }

  get thicknessPower() {
    return this.uniforms.thicknessPower.value;
  }

  set thicknessPower( value ) {
    this.uniforms.thicknessPower.value = value;
  }

  get thicknessScale() {
    return this.uniforms.thicknessScale.value;
  }

  set thicknessScale( value ) {
    this.uniforms.thicknessScale.value = value;
  }

  get thicknessDistortion() {
    return this.uniforms.thicknessDistortion.value;
  }

  set thicknessDistortion( value ) {
    this.uniforms.thicknessDistortion.value = value;
  }

  get thicknessAmbient() {
    return this.uniforms.thicknessAmbient.value;
  }

  set thicknessAmbient( value ) {
    this.uniforms.thicknessAmbient.value = value;
  }

  get thicknessAttenuation() {
    return this.uniforms.thicknessAttenuation.value;
  }

  set thicknessAttenuation( value ) {
    this.uniforms.thicknessAttenuation.value = value;
  }

  get diffuseColorInfluence() {
    return this.uniforms.diffuseColorInfluence.value;
  }

  set diffuseColorInfluence( value ) {
    this.uniforms.diffuseColorInfluence.value = value;
  }

  get thicknessIOR() {
    return this.uniforms.thicknessIOR.value;
  }

  set thicknessIOR( value ) {
    this.uniforms.thicknessIOR.value = value;
  }

  get parallaxScale1() {
    return this.uniforms.parallaxScale1.value;
  }

  set parallaxScale1( value ) {
    this.uniforms.parallaxScale1.value = value;
  }

  get parallaxScale2() {
    return this.uniforms.parallaxScale2.value;
  }

  set parallaxScale2( value ) {
    this.uniforms.parallaxScale2.value = value;
  }

  get parallaxScale3() {
    return this.uniforms.parallaxScale3.value;
  }

  set parallaxScale3( value ) {
    this.uniforms.parallaxScale3.value = value;
  }

  get useTranslucency () {
    return this._useTranslucency;
  }

  set useTranslucency( value ) {
    if ( value === false ) {
      const defines = {};
      for ( let [ key, value ] of Object.entries( this.defines ) ) {
        if ( !key.includes( 'USE_TRANSLUCENCY' ) ) defines[ key ] = value;
      }
      this.defines = defines;
    } else if ( value === true ) {
      this.defines[ 'USE_TRANSLUCENCY' ] = '';
    }
    this.needsUpdate = true;
  }
}

function setFlags (material) {
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  material.type = 'IceMaterial';
}

module.exports = IceMaterial;
