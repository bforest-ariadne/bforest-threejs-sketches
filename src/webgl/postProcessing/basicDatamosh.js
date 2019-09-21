const { EffectComposer, EffectPass, RenderPass, SMAAEffect } = require('postprocessing');
const { webgl, assets, gui } = require('../../context');
const DatamoshEffect = require('./datamoshEffect');
// const FeedbackLiveEffect = require('./feedbackLiveEffect');

module.exports = function basicBloom( useGui = true ) {
  webgl.composer = new EffectComposer( webgl.renderer );

  const smaaEffect = new SMAAEffect(assets.get('smaa-search'), assets.get('smaa-area'));
  smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.05);

  const feedbackEffect = new DatamoshEffect();

  const smaaPass = new EffectPass(webgl.camera, smaaEffect );
  const effectPass = new EffectPass(webgl.camera, feedbackEffect );
  // smaaPass.renderToScreen = true;
  effectPass.renderToScreen = true;

  webgl.composer.addPass(new RenderPass(webgl.scene, webgl.camera));
  webgl.composer.addPass(smaaPass);
  webgl.composer.addPass(effectPass);

  const setupGui = () => {
    const params = {
      'mixAmount': 0.3,
      'uniform1': 0.0,
      'uniform2': 0.0,
      'uniform3': 0.0
    };

    // gui.add( params, 'mixAmount' ).min(0.0).max(1.0).step(0.01).onChange( () => {
    //   feedbackEffect.feedbackMaterial.mixAmount = Number.parseFloat(params.mixAmount);
    // });
    // gui.add( params, 'uniform1' ).min(0.0).max(10.0).step(0.01).onChange( () => {
    //   feedbackEffect.feedbackMaterial.uniform1 = Number.parseFloat(params.uniform1);
    // });
    // gui.add( params, 'uniform2' ).min(0.0).max(1.0).step(0.01).onChange( () => {
    //   feedbackEffect.feedbackMaterial.uniform2 = Number.parseFloat(params.uniform2);
    // });
    // gui.add( params, 'uniform3' ).min(0.0).max(1.0).step(0.01).onChange( () => {
    //   feedbackEffect.feedbackMaterial.uniform3 = Number.parseFloat(params.uniform3);
    // });
  };

  if ( useGui ) setupGui();
};
