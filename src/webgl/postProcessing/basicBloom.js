const { BloomEffect, EffectComposer, EffectPass, RenderPass, KernelSize, BlendFunction, SMAAEffect, BrightnessContrastEffect } = require('postprocessing');
const { webgl, assets } = require('../../context');

module.exports = function basicBloom() {
  webgl.composer = new EffectComposer( webgl.renderer );

  const smaaEffect = new SMAAEffect(assets.get('smaa-search'), assets.get('smaa-area'));
  smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.05);

  const bloomEffect = new BloomEffect({
    blendFunction: BlendFunction.SCREEN,
    kernelSize: KernelSize.Huge,
    luminanceThreshold: 0.05,
    luminanceSmoothing: 0.89,
    height: 480});

  bloomEffect.inverted = true;
  bloomEffect.blendMode.opacity.value = 0.8;

  const brightContrastEffect = new BrightnessContrastEffect();
  brightContrastEffect.uniforms.get('contrast').value = 0.1;

  const effectPass = new EffectPass(webgl.camera, smaaEffect, brightContrastEffect, bloomEffect );
  effectPass.renderToScreen = true;

  webgl.composer.addPass(new RenderPass(webgl.scene, webgl.camera));
  webgl.composer.addPass(effectPass);
};
