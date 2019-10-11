const { BloomEffect, EffectComposer, EffectPass, RenderPass, KernelSize, BlendFunction, SMAAEffect, BrightnessContrastEffect, DepthEffect } = require('postprocessing');
const { webgl, assets, gui } = require('../../context');
const defined = require('defined');
const RenderMode = {
  DEFAULT: 0,
  NORMALS: 1,
  DEPTH: 2
};

module.exports = function basicBloom() {
  let params = {
    'bloomEffect': {
      'resolution': 360,
      'kernel size': KernelSize.HUGE,
      'scale': 1,
      'opacity': 3.11,
      'luminance': {
        'filter': true,
        'threshold': 0.079,
        'smoothing': 0.89
      }
    },
    postProcessing: {
      renderMode: RenderMode.DEFAULT
    },
    exposure: 4.2,
    whitePoint: 5,
    toneMapping: 'Uncharted2'
  };

  // params = defined( app.sceneObj.pars, params );

  if ( defined( webgl.sceneObj.pars, false ) ) {
    Object.assign( params, webgl.sceneObj.pars );
  }
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

  // const depthEffect = new DepthEffect({
  //   blendFunction: BlendFunction.SKIP
  // });

  const brightContrastEffect = new BrightnessContrastEffect();
  brightContrastEffect.uniforms.get('contrast').value = 0.1;

  const effectPass = new EffectPass(webgl.camera, smaaEffect, brightContrastEffect, bloomEffect );
  // const effectPass = new EffectPass(webgl.camera, smaaEffect, brightContrastEffect, bloomEffect, depthEffect );
  effectPass.renderToScreen = true;

  webgl.composer.addPass(new RenderPass(webgl.scene, webgl.camera));
  webgl.composer.addPass(effectPass);

  // function toggleRenderMode() {
  //   const mode = Number.parseInt(params.postProcessing['renderMode']);

  //   // effectPass.enabled = (mode === RenderMode.DEFAULT || mode === RenderMode.DEPTH);
  //   // normalPass.renderToScreen = (mode === RenderMode.NORMALS);
  //   depthEffect.blendMode.blendFunction = (mode === RenderMode.DEPTH) ? BlendFunction.NORMAL : BlendFunction.SKIP;

  //   effectPass.recompile();
  // }

  // global.modes = BlendFunction;

  // let fold = gui.addFolder({title: 'Post'});
  // fold.expanded = false;

  // fold.addInput(params.postProcessing, 'renderMode', {
  //   options: {
  //     default: RenderMode.DEFAULT,
  //     // normals: RenderMode.NORMALS,
  //     depth: RenderMode.DEPTH
  //   }
  // }).onChange(toggleRenderMode);
};
