const { BloomEffect, EffectComposer, EffectPass, RenderPass, KernelSize, BlendFunction, SMAAEffect, BrightnessContrastEffect } = require('postprocessing');
const { gui, webgl, assets } = require('../../context');

module.exports = function basicBloom() {
  webgl.composer = new EffectComposer( webgl.renderer );

  const smaaEffect = new SMAAEffect(assets.get('smaa-search'), assets.get('smaa-area'));
  smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.05);

  const bloomEffect = new BloomEffect({
    blendFunction: BlendFunction.SCREEN,
    kernelSize: KernelSize.MEDIUM,
    luminanceThreshold: 0.5,
    luminanceSmoothing: 0.00,
    height: 480});

  bloomEffect.inverted = true;
  bloomEffect.blendMode.opacity.value = 2.3;

  const brightContrastEffect = new BrightnessContrastEffect();

  const effectPass = new EffectPass(webgl.camera, smaaEffect, bloomEffect );
  effectPass.renderToScreen = true;

  webgl.composer.addPass(new RenderPass(webgl.scene, webgl.camera));
  webgl.composer.addPass(effectPass);
};
