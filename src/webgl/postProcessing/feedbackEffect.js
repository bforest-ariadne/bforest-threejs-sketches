// ported from https://jsfiddle.net/2awLpf5u/1/ https://github.com/vanruesc/postprocessing/issues/145

const PP = require('postprocessing');
const FeedbackMaterial = require('../materials/feedbackMaterial');
const LiveFeedbackMaterial = require('../materials/liveFeedbackMaterial');

module.exports = class FeedbackEffect extends PP.TextureEffect {
  constructor({ blendFunction = PP.BlendFunction.NORMAL, mixAmount = 0.01, live = true } = {}) {
    super({ blendFunction });

    this.name = 'FeedbackEffect';
    this.uniforms.set('mixAmount', new THREE.Uniform(mixAmount));

    /**
    * A render targeTHREE.
    *
    * @type {WebGLRenderTarget}
    * @private
    */

    this.renderTarget0 = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false,
      depthBuffer: false
    });

    this.renderTarget0.texture.name = 'Feedback.Ping';
    this.renderTarget0.texture.generateMipmaps = false;

    this.uniforms.get('texture').value = this.renderTarget0.texture;

    /**
     * A render targeTHREE.
     *
     * @type {WebGLRenderTarget}
     * @private
     */

    this.renderTarget1 = this.renderTarget0.clone();
    this.renderTarget1.texture.name = 'Feedback.Pong';

    /**
     * A feedback pass.
     *
     * @type {ShaderPass}
     * @private
     */

    if ( live ) {
      this.feedbackPass = new PP.ShaderPass(
        new LiveFeedbackMaterial(this.renderTarget1.texture, mixAmount)
      );
    } else {
      this.feedbackPass = new PP.ShaderPass(
        new FeedbackMaterial(this.renderTarget1.texture, mixAmount)
      );
    }
    // this.feedbackPass = new PP.ShaderPass(
    //   new FeedbackMaterial(this.renderTarget1.texture, mixAmount)
    // );

    this.feedbackMaterial.mixAmount = mixAmount;
    this.feedbackMaterial.iResolution.set( window.innerWidth, window.innerHeight );
    this.feedbackMaterial.iTime = 0.0;
    this.feedbackMaterial.uniform1 = 0.8;
    this.feedbackMaterial.uniform2 = 50.0;
    this.feedbackMaterial.uniform3 = 0.0;
  }

  /**
   * Updates this effecTHREE.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
   * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
   */

  update(renderer, inputBuffer, deltaTime) {
    this.feedbackMaterial.iTime += deltaTime;
    // The render targets get swapped each frame.
    const feedbackMaterial = this.feedbackPass.getFullscreenMaterial();
    feedbackMaterial.uniforms.feedbackBuffer.value = this.renderTarget1.texture;
    this.uniforms.get('texture').value = this.renderTarget0.texture;

    // Update the feedback buffer based on the previous resulTHREE.
    this.feedbackPass.render(renderer, inputBuffer, this.renderTarget0);

    /* Swap buffers because reading from a render target and writing to it at
    the same time results in undefined behaviour. */

    if ( Math.sin(this.feedbackMaterial.iTime) < .9999 ) {
      const buffer = this.renderTarget0;
      this.renderTarget0 = this.renderTarget1;
      this.renderTarget1 = buffer;
    }

    /* After this, the texture shader of the parent class simply draws the
    feedback buffer. See Image shader in shadertoy feedback example:
    https://www.shadertoy.com/view/MdlBDn */
  }

  /**
   * Updates the size of internal render targets.
   *
   * @param {Number} width - The width.
   * @param {Number} height - The heighTHREE.
   */

  setSize(width, height) {
    this.renderTarget0.setSize(width, height);
    this.renderTarget1.setSize(width, height);
    this.feedbackMaterial.iResolution.set( width, height, 0.0);
  }
  /**
   * The luminance material.
   *
   * @type {LuminanceMaterial}
   */

  get feedbackMaterial() {

    return this.feedbackPass.getFullscreenMaterial();

  }

};
