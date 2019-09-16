const Honeycomb = require('./webgl/scene/Honeycomb');
const SpinningBox = require('./webgl/scene/SpinningBox');
const Bpose = require('./webgl/scene/bpose');
const SketchScene = require('./webgl/scene/SketchScene');
const query = require('./util/query');
const defined = require('defined');

const { assets, webgl, gui } = require('./context');
const scenes = [ Bpose, Honeycomb, SpinningBox, SketchScene ];
const DefaultScene = SketchScene;

module.exports = function () {
  // Set background color
  const background = 'black';
  document.body.style.background = background;
  webgl.renderer.setClearColor(background);

  // Hide canvas
  webgl.canvas.style.visibility = 'hidden';

  // Preload any queued assets
  assets.loadQueued(() => {
    console.log('Done loading');

    // Show canvas
    webgl.canvas.style.visibility = '';

    // To avoid page pulling and such
    webgl.canvas.addEventListener('touchstart', ev => ev.preventDefault());

    let found = false;

    for ( let i in scenes ) {
      console.log('scenes', scenes[i].name, query.scene );
      let sceneName = scenes[i].name.toLowerCase();
      let queryName = defined( query.scene, false ).toLowerCase();
      if ( sceneName === queryName ) {
        webgl.scene.add( new scenes[i]() );
        found = true;
        console.log('scene found', scenes[i].name );
      }
    }

    console.log(assets);
    if ( !found ) webgl.scene.add( new DefaultScene() );

    webgl.sceneObj.init();

    // start animation loop
    webgl.start();
    webgl.draw();
  });
};
