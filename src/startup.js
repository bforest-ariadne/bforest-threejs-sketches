const query = require('./util/query');
const defined = require('defined');
const { TweenMax } = require( 'gsap/umd/TweenMax' );

const { assets, webgl } = require('./context');
const scenes = [
  require('./webgl/scene/SketchScene'),
  require('./webgl/scene/Honeycomb'),
  require('./webgl/scene/SpinningBox'),
  require('./webgl/scene/bpose'),
  require('./webgl/scene/PhysicsTest'),
  require('./webgl/scene/FeedbackTest'),
  require('./webgl/scene/PbrTest'),
  require('./webgl/scene/TranslucentTest'),
  require('./webgl/scene/boidTest'),
  require('./webgl/scene/GoldenFlock'),
  require('./webgl/scene/GoldenFlock2')
];

const DefaultScene = scenes[0];

module.exports = function () {
  // Set background color
  const background = 'black';
  document.body.style.background = background;
  webgl.renderer.setClearColor(background);

  // Hide canvas
  webgl.canvas.style.visibility = 'hidden';

  // Preload any queued assets
  assets.loadQueued(() => {
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

    const sceneLinks = document.getElementById('sceneLinks');
    const titleElement = document.getElementById('title');
    let count = 0;

    let found = false;
    for ( let i in scenes ) {
      let sceneName = scenes[i].name.toLowerCase();
      let queryName = defined( query.scene, '' ).toLowerCase();
      if ( sceneName === queryName ) {
        webgl.scene.add( new scenes[i]() );
        titleElement.textContent = scenes[i].title;
        found = true;
      }
      if ( scenes[i].publish ) {
        if ( count > 0) {
          sceneLinks.appendChild( document.createTextNode( ' - ' ) );
        }
        count++;
        sceneLinks.appendChild( scenes[i].getSceneLink(
          count,
          sceneName,
          scenes[i].title
        ) );
      }
    }
    if ( !found ) webgl.scene.add( new DefaultScene() );

    webgl.sceneObj.init();

    // start animation loop
    webgl.start();
  });
};
