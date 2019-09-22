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
    middleGrey: 0.76,
    maxLuminance: 2.0,
    averageLuminance: 1.0,
    adaptationRate: 5.0
  });


  const effectPass = new EffectPass(webgl.camera, smaaEffect, toneMappingEffect );
  // smaaPass.renderToScreen = true;
  effectPass.dithering = true;
  effectPass.renderToScreen = true;

  webgl.composer.addPass(new RenderPass(webgl.scene, webgl.camera));
  webgl.composer.addPass(effectPass);

  const setupGui = () => {

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



		let f = gui.addFolder({title: "Luminance"});


		f.addInput(params, "resolution", {
      options: {'64': 64, '128': 128, '256': 256, '512': 512, '1024': 1024}
      
    }).on( 'change',() => {
			effect.resolution = Number.parseInt(params.resolution);
		});

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

		// gui.addInput(params, "opacity", {min: 0.0, max: 1.0, step: 0.01}).on( 'change',() => {

		// 	blendMode.opacity.value = params.opacity;

		// });

		// gui.addInput(params, "blend mode", BlendFunction).on( 'change',() => {

		// 	blendMode.blendFunction = Number.parseInt(params["blend mode"]);
		// 	pass.recompile();

		// });

		// gui.addInput(effectPass, "dithering");


    global.toneMappingEffect = toneMappingEffect;
    // let u3gui = gui.addInput( params, 'uniform3', 0.0, 100 }).on( 'change', () => {
    //   datamoshEffect.dataMoshMaterial.uniform3 = Number.parseFloat(params.uniform3);
    // });

  };

  if ( useGui ) setupGui();
};
