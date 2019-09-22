const { EffectComposer, EffectPass, RenderPass, SMAAEffect, ToneMappingEffect, BlendFunction } = require('postprocessing');
const { webgl, assets, gui } = require('../../context');
// const FeedbackEffect = require('./feedbackEffect');
const DatamoshEffect = require('./datamoshEffect');
const defined = require('defined');

// const FeedbackLiveEffect = require('./feedbackLiveEffect');

module.exports = function basicBloom( useGui = true ) {
  webgl.composer = new EffectComposer( webgl.renderer );

  const smaaEffect = new SMAAEffect(assets.get('smaa-search'), assets.get('smaa-area'));
  smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.05);

  const toneMappingEffect = new ToneMappingEffect({
    blendFunction: BlendFunction.NORMAL,
    adaptive: true,
    resolution: 256,
    middleGrey: 0.6,
    maxLuminance: 16.0,
    averageLuminance: 1.0,
    adaptationRate: 2.0
  });

  const datamoshEffect = new DatamoshEffect({ mixAmount: 0.1, live: true });

  const smaaPass = new EffectPass(webgl.camera, smaaEffect );
  smaaPass.dithering = true;

  const effectPass = new EffectPass(webgl.camera, datamoshEffect, toneMappingEffect );
  // smaaPass.renderToScreen = true;
  effectPass.renderToScreen = true;

  webgl.composer.addPass(new RenderPass(webgl.scene, webgl.camera));
  webgl.composer.addPass(smaaPass);
  webgl.composer.addPass(effectPass);

  const setupGui = () => {
    // const params = {
    //   threshold: 0.0,
    //   offset: 50
    // };

    gui.addInput( datamoshEffect.dataMoshMaterial.uniforms.threshold, 'value', {
      min: 0,
      max: 1,
      step: 0.01
    }).on( 'change', () => {
      // datamoshEffect.dataMoshMaterial.uniforms.threshold.value = Number.parseFloat(params.threshold);
    });

    gui.addInput( datamoshEffect.dataMoshMaterial.uniforms.offset, 'value', {
      min: 0,
      max: 300
    }).on( 'change', () => {
      // datamoshEffect.dataMoshMaterial.uniforms.offset.value = Number.parseFloat(params.offset);
    });

    const effect = toneMappingEffect;
    const blendMode = effect.blendMode;
    const pass = effectPass;


    const params = {
			"resolution": effect.resolution,
			"adaptation rate": 2,
			"average lum": effect.uniforms.get("averageLuminance").value,
			"max lum": effect.uniforms.get("maxLuminance").value,
			"middle grey": effect.uniforms.get("middleGrey").value,
			"opacity": blendMode.opacity.value,
			"blend mode": blendMode.blendFunction
		};


		gui.addInput(params, "resolution", {
      options: {'64': 64, '128': 128, '256': 256, '512': 512, '1024': 1024}
      
    }).on( 'change',() => {

			effect.resolution = Number.parseInt(params.resolution);
      console.log('effect resolution', effect.resolution)

		});

		let f = gui.addFolder({title: "Luminance"});

		f.addInput(effect, "adaptive").on( 'change',() => {

			pass.recompile();

		});

		f.addInput(params, "adaptation rate", {min: 0.0, max: 5.0, step: 0.01}).on( 'change',() => {

			effect.adaptationRate = params["adaptation rate"];

		});

		f.addInput(params, "average lum", {min: 0.01, max: 1.0, step: 0.01}).on( 'change',() => {

			effect.uniforms.get("averageLuminance").value = params["average lum"];

		});

		f.addInput(params, "max lum", {min: 0.0, max: 32.0, step: 1}).on( 'change',() => {

			effect.uniforms.get("maxLuminance").value = params["max lum"];

		});

		f.addInput(params, "middle grey", {min: 0.0, max: 1.0, step: 0.01}).on( 'change',() => {

			effect.uniforms.get("middleGrey").value = params["middle grey"];

		});

		// f.open();

		gui.addInput(params, "opacity", {min: 0.0, max: 1.0, step: 0.01}).on( 'change',() => {

			blendMode.opacity.value = params.opacity;

		});

		gui.addInput(params, "blend mode", BlendFunction).on( 'change',() => {

			blendMode.blendFunction = Number.parseInt(params["blend mode"]);
			pass.recompile();

		});

		gui.addInput(effectPass, "dithering");


    global.toneMappingEffect = toneMappingEffect;
    // let u3gui = gui.addInput( params, 'uniform3', 0.0, 100 }).on( 'change', () => {
    //   datamoshEffect.dataMoshMaterial.uniform3 = Number.parseFloat(params.uniform3);
    // });

  };

  if ( useGui ) setupGui();
};
