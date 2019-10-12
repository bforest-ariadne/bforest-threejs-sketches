const { BloomEffect, EffectComposer, EffectPass, RenderPass, KernelSize, BlendFunction, SMAAEffect, BrightnessContrastEffect, DepthEffect } = require('postprocessing');
const { webgl, assets, gui } = require('../../context');
const defined = require('defined');
const { toneMappingOptions } = require('../../util/constants');
const RenderMode = {
  DEFAULT: 0,
  NORMALS: 1,
  DEPTH: 2
};

module.exports = function basicBloom( guiEnabled = false ) {
  let params = {
    'bloomEffect': {
      'dithering': true,
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
    renderer: {
      exposure: 4.2,
      whitePoint: 5,
      toneMapping: 'Uncharted2'
    }

  };


  if ( defined( webgl.sceneObj.pars, false ) ) {
    Object.assign( params, webgl.sceneObj.pars );
  }
  webgl.composer = new EffectComposer( webgl.renderer );

  const smaaEffect = new SMAAEffect(assets.get('smaa-search'), assets.get('smaa-area'));
  smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.05);

  const bloomEffect = new BloomEffect({
    blendFunction: BlendFunction.SCREEN,
    kernelSize: params.bloomEffect['kernel size'],
    luminanceThreshold: params.bloomEffect.luminance.threshold,
    luminanceSmoothing: params.bloomEffect.luminance.smoothing,
    height: params.bloomEffect.resolution
  });

  bloomEffect.inverted = true;
  bloomEffect.blendMode.opacity.value = params.bloomEffect.opacity;
  bloomEffect.dithering = true;
  bloomEffect.luminancePass.enabled = params.bloomEffect.luminance.filter;

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

  if ( !guiEnabled ) return;

  const scene = webgl.sceneObj;

  const postFolder = gui.addFolder({
    title: `Post FX`,
    expanded: false
  }).on( 'fold', () => {
    scene.postFolders.forEach( folder => {
      const element = folder.controller.view.element;
      element.style.display = postFolder.expanded ? '' : 'none';
    } );
  });

  const renderFolder = gui.addFolder({
    title: `renderer`,
    expanded: false
  });
  scene.postFolders.push( renderFolder );

  const updateRenderPars = () => {
    webgl.renderer.toneMappingExposure = params.renderer.exposure;
    webgl.renderer.toneMappingWhitePoint = params.renderer.whitePoint;
    webgl.renderer.toneMapping = params.renderer.toneMapping;
  }

  const scaleGui = renderFolder.addInput( webgl, 'scale', {
    min: 0.1,
    max: 2
  });
  window.scaleGui = scaleGui;
  renderFolder.addButton({
    title: 'reset scale'
  }).on( 'click', () => {
    webgl.scale = 1;
    gui.refresh();
  });

  renderFolder.addInput( params.renderer, 'exposure', {
    min: 0,
    max: 10
  }).on( 'change', () => { updateRenderPars(); });

  renderFolder.addInput( params.renderer, 'whitePoint', {
    min: 0,
    max: 10
  }).on( 'change', () => { updateRenderPars(); });

  renderFolder.addInput( params.renderer, 'toneMapping', {
    options: Object.keys( toneMappingOptions )
  }).on( 'change', () => { updateRenderPars(); });


  const bloomFolder = gui.addFolder({
    title: `renderer`,
    expanded: false
  });
  scene.postFolders.push( bloomFolder );

  scene.postFolders.forEach( folder => {
    const element = folder.controller.view.element;
    element.style.display = postFolder.expanded ? '' : 'none';
  } );

};
