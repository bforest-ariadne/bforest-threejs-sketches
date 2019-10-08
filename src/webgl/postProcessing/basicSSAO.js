const { EffectComposer, EffectPass, RenderPass, SMAAEffect, BlendFunction, SSAOEffect, NormalPass, DepthEffect } = require('postprocessing');
const { webgl, assets, gui } = require('../../context');
const defined = require('defined');

// const FeedbackLiveEffect = require('./feedbackLiveEffect');

module.exports = function basicBloom( useGui = true ) {
  webgl.composer = new EffectComposer( webgl.renderer );

  const smaaEffect = new SMAAEffect(assets.get('smaa-search'), assets.get('smaa-area'));
  smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.05);

  const normalPass = new NormalPass(webgl.scene, webgl.camera);

  const depthEffect = new DepthEffect({
    blendFunction: BlendFunction.SKIP
  });

  const ssaoEffect = new SSAOEffect(webgl.camera, normalPass.renderTarget.texture, {
    blendFunction: BlendFunction.MULTIPLY,
    samples: Math.floor( 3.66 * webgl.gpuInfo.tierNum ),
    rings: 4,
    distanceThreshold: 0.6,
    distanceFalloff: 0.1,
    rangeThreshold: 0.0015,
    rangeFalloff: 0.01,
    luminanceInfluence: 0.7,
    radius: 18.25,
    scale: 1.0,
    bias: 0.5
  });

  const effectPass = new EffectPass(webgl.camera, smaaEffect, ssaoEffect, depthEffect );
  // smaaPass.renderToScreen = true;
  // effectPass.dithering = true;
  effectPass.renderToScreen = true;

  const renderPass = new RenderPass(webgl.scene, webgl.camera);
  renderPass.renderToScreen = false;

  webgl.composer.addPass(renderPass);
  webgl.composer.addPass(normalPass);
  webgl.composer.addPass(effectPass);

  const setupGui = () => {
    const blendMode = ssaoEffect.blendMode;
    const uniforms = ssaoEffect.uniforms;

    const RenderMode = {
      DEFAULT: 0,
      NORMALS: 1,
      DEPTH: 2
    };

    const params = {
      'distance': {
        'threshold': uniforms.get('distanceCutoff').value.x,
        'falloff': uniforms.get('distanceCutoff').value.y - uniforms.get('distanceCutoff').value.x
      },
      'proximity': {
        'threshold': uniforms.get('proximityCutoff').value.x,
        'falloff': uniforms.get('proximityCutoff').value.y - uniforms.get('proximityCutoff').value.x
      },
      'lum influence': uniforms.get('luminanceInfluence').value,
      'scale': uniforms.get('scale').value,
      'bias': uniforms.get('bias').value,
      'render mode': RenderMode.DEFAULT,
      'opacity': blendMode.opacity.value,
      'blend mode': blendMode.blendFunction
    };

    function toggleRenderMode() {
      const mode = Number.parseInt(params['render mode']);

      effectPass.enabled = (mode === RenderMode.DEFAULT || mode === RenderMode.DEPTH);
      normalPass.renderToScreen = (mode === RenderMode.NORMALS);
      depthEffect.blendMode.blendFunction = (mode === RenderMode.DEPTH) ? BlendFunction.NORMAL : BlendFunction.SKIP;

      effectPass.recompile();
    }

    global.modes = BlendFunction;

    let fold = gui.addFolder({title: 'SSAO'});
    fold.expanded = false;

    fold.addInput(params, 'render mode', {
      options: {
        default: RenderMode.DEFAULT,
        normals: RenderMode.NORMALS,
        depth: RenderMode.DEPTH 
      }
    }).onChange(toggleRenderMode);

    // f.addInput(params, 'resolution', {
    //   options: {'64': 64, '128': 128, '256': 256, '512': 512, '1024': 1024}

    // }).on( 'change', () => {
    //   effect.resolution = Number.parseInt(params.resolution);
    // });

    fold.addInput(ssaoEffect, 'samples', {min: 1.0, max: 32, step: 1}).on( 'change', () => { effectPass.recompile(); });
    fold.addInput(ssaoEffect, 'rings', {min: 1, max: 16, step: 1}).on( 'change', () => { effectPass.recompile(); });
    fold.addInput(ssaoEffect, 'radius', {min: 0.01, max: 50, step: 0.01});

    fold.addInput(params, 'lum influence', {min: 0.0, max: 1.0, step: 0.001}).on( 'change', () => {
      uniforms.get('luminanceInfluence').value = params['lum influence'];
    });

    let f = gui.addFolder({title: 'Distance Cutoff'});

    f.addInput(params.distance, 'threshold', {min: 0.0, max: 1.0, step: 0.001}).on( 'change', () => {
      ssaoEffect.setDistanceCutoff(params.distance.threshold, params.distance.falloff);
    });

    f.addInput(params.distance, 'falloff', {min: 0.0, max: 1.0, step: 0.001}).on( 'change', () => {
      ssaoEffect.setDistanceCutoff(params.distance.threshold, params.distance.falloff);
    });

    f = gui.addFolder('Proximity Cutoff');

    f.addInput(params.proximity, 'threshold', {min: 0.0, max: 0.06, step: 0.0001}).on( 'change', () => {
      ssaoEffect.setProximityCutoff(params.proximity.threshold, params.proximity.falloff);
    });

    f.addInput(params.proximity, 'falloff', {min: 0.0, max: 0.1, step: 0.0001}).on( 'change', () => {
      ssaoEffect.setProximityCutoff(params.proximity.threshold, params.proximity.falloff);
    });

    f.addInput(params, 'bias', {min: -1.0, max: 1.0, step: 0.001}).on( 'change', () => {
      uniforms.get('bias').value = params.bias;
    });

    f.addInput(params, 'scale', {min: 0.0, max: 2.0, step: 0.001}).on( 'change', () => {
      uniforms.get('scale').value = params.scale;
    });

    f.addInput(params, 'opacity', {min: 0, max: 10.0, step: 0.01}).on( 'change', () => {
      blendMode.opacity.value = params.opacity;
    });
    f.addInput(params, "blend mode", {options: BlendFunction}).on( 'change', () => {
      blendMode.blendFunction = Number.parseInt(params["blend mode"]);
			effectPass.recompile();
    });
  };

  if ( useGui ) setupGui();
};
