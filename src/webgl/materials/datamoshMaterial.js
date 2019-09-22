// ported from https://jsfiddle.net/2awLpf5u/1/ https://github.com/vanruesc/postprocessing/issues/145

const feedbackShader = require('../shaders/datamosh.shader');
const LiveShaderMaterial = require('shader-reload/three/LiveShaderMaterial');

module.exports = class DatamoshMaterial extends LiveShaderMaterial {
  /**
   * Constructs a new feedback material.
   *
   * @param {Texture} feedbackBuffer - A buffer that contains the last feedback resulTHREE.
   * @param {Number} mixAmount - The feedback mix amounTHREE.
  */

  constructor(feedbackBuffer, mixAmount) {
    super( feedbackShader, {

      type: 'DatamoshMaterial',

      uniforms: {

        inputBuffer: new THREE.Uniform(null),
        feedbackBuffer: new THREE.Uniform(feedbackBuffer),
        iTime: new THREE.Uniform(0.0),
        iResolution: new THREE.Uniform(new THREE.Vector3( window.innerWidth, window.innerHeight, 0.0 ) ),
        threshold: new THREE.Uniform(1.0),
        offset: new THREE.Uniform(50.0),
        USE_RGB_SHIFT: new THREE.Uniform(0),
        USE_HUE_SHIFT: new THREE.Uniform(0)
      },

      depthWrite: false,
      depthTest: false

    });
  }
  /**
   * The mixAmount.
   *
   * @type {Number}
   */

  get mixAmount() {
    return this.uniforms.mixAmount.value;
  }

  /**
   * Sets the mixAmount.
   *
   * @type {Number}
   */

  set mixAmount(value) {
    this.uniforms.mixAmount.value = value;
  }

  /**
   * The iTime.
   *
   * @type {Number}
   */

  get iTime() {
    return this.uniforms.iTime.value;
  }

  /**
   * Sets the iTime.
   *
   * @type {Number}
   */

  set iTime(value) {
    this.uniforms.iTime.value = value;
  }

  /**
     * The iResolution.
     *
     * @type {Number}
     */

  get iResolution() {
    return this.uniforms.iResolution.value;
  }

  /**
     * Sets the iResolution.
     *
     * @type {Number}
     */

  set iResolution(value) {
    this.uniforms.iResolution.value = value;
  }

  // /**
  //  * The uniform1.
  //  *
  //  * @type {Number}
  //  */

  // get uniform1() {
  //   return this.uniforms.uniform1.value;
  // }

  // /**
  //  * Sets the uniform1.
  //  *
  //  * @type {Number}
  //  */

  // set uniform1(value) {
  //   this.uniforms.uniform1.value = value;
  // }

  // /**
  //  * The uniform2.
  //  *
  //  * @type {Number}
  //  */

  // get uniform2() {
  //   return this.uniforms.uniform2.value;
  // }

  // /**
  //  * Sets the uniform2.
  //  *
  //  * @type {Number}
  //  */

  // set uniform2(value) {
  //   this.uniforms.uniform2.value = value;
  // }

  // /**
  //  * The uniform3.
  //  *
  //  * @type {Number}
  //  */

  // get uniform3() {
  //   return this.uniforms.uniform3.value;
  // }

  // /**
  //  * Sets the uniform3.
  //  *
  //  * @type {Number}
  //  */

  // set uniform3(value) {
  //   this.uniforms.uniform3.value = value;
  // }
};
