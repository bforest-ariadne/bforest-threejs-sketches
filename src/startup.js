const Honeycomb = require('./webgl/scene/Honeycomb');
const SpinningBox = require('./webgl/scene/SpinningBox');
const Bpose = require('./webgl/scene/bpose');
const SketchScene = require('./webgl/scene/SketchScene');
const query = require('./util/query');
const defined = require('defined');
const { TweenMax } = require( 'gsap/umd/TweenMax' );

const { assets, webgl } = require('./context');
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

    webgl.on( 'show', () => {
      // Show canvas
      webgl.canvas.style.visibility = '';
      TweenMax.fromTo(webgl.loadingPage, 0.5, {opacity: 1}, {opacity: 0})
        .eventCallback( 'onComplete', () => {
          webgl.loadingPage.style.display = 'none';
        });
    });

    // To avoid page pulling and such
    webgl.canvas.addEventListener('touchstart', ev => ev.preventDefault());

    let found = false;
    for ( let i in scenes ) {
      let sceneName = scenes[i].name.toLowerCase();
      let queryName = defined( query.scene, '' ).toLowerCase();
      if ( sceneName === queryName ) {
        webgl.scene.add( new scenes[i]() );
        found = true;
      }
    }
    if ( !found ) webgl.scene.add( new DefaultScene() );

    webgl.sceneObj.init();

    // start animation loop
    webgl.start();
  });
};
