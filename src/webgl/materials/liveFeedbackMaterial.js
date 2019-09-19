// ported from https://jsfiddle.net/2awLpf5u/1/ https://github.com/vanruesc/postprocessing/issues/145

const feedbackShader = require('../shaders/feedback.shader');
const LiveShaderMaterial = require('shader-reload/three/LiveShaderMaterial');

module.exports = class FeedbackMaterial extends LiveShaderMaterial {
  /**
   * Constructs a new feedback material.
   *
   * @param {Texture} feedbackBuffer - A buffer that contains the last feedback resulTHREE.
   * @param {Number} mixAmount - The feedback mix amounTHREE.
  */

  constructor(feedbackBuffer, mixAmount) {
    super( feedbackShader, {

      type: 'FeedbackMaterial',

      uniforms: {

        inputBuffer: new THREE.Uniform(null),
        feedbackBuffer: new THREE.Uniform(feedbackBuffer),
        mixAmount: new THREE.Uniform(mixAmount)

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
};
