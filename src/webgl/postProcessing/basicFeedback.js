const { EffectComposer, EffectPass, RenderPass, SMAAEffect } = require('postprocessing');
const { webgl, assets, gui } = require('../../context');
const FeedbackEffect = require('./feedbackEffect');

module.exports = function basicBloom( useGui = true ) {
  webgl.composer = new EffectComposer( webgl.renderer );

  const smaaEffect = new SMAAEffect(assets.get('smaa-search'), assets.get('smaa-area'));
  // smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.05);

  const feedbackEffect = new FeedbackEffect({ mixAmount: 0.1, live: true });

  const smaaPass = new EffectPass(webgl.camera, smaaEffect );
  const effectPass = new EffectPass(webgl.camera, feedbackEffect );
  // smaaPass.renderToScreen = true;
  effectPass.renderToScreen = true;

  webgl.composer.addPass(new RenderPass(webgl.scene, webgl.camera));
  webgl.composer.addPass(smaaPass);
  webgl.composer.addPass(effectPass);

  const setupGui = () => {
    const params = {
      'mixAmount': 0.3
    };

    gui.add( params, 'mixAmount' ).min(0.0).max(1.0).step(0.01).onChange( () => {
      feedbackEffect.feedbackMaterial.mixAmount = Number.parseFloat(params.mixAmount);
    });
  };

  if ( useGui ) setupGui();
};
