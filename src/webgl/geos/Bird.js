// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
function createBirdInstanceGeometry( width ) {
  const WIDTH = width;
  const BIRDS = WIDTH * WIDTH;
  var triangles = BIRDS * 3;
  var points = triangles * 3;

  var birdGeo = new THREE.BufferGeometry();
  var wingsSpan = 20;

  var vertices = new Float32Array( [
    // body
    0, -0, -20,
    0, 4, -20,
    0, 0, 30,

    // left wing
    0, 0, -15,
    -wingsSpan, 0, 0,
    0, 0, 15,

    // right wing
    0, 0, 15,
    wingsSpan, 0, 0,
    0, 0, -15
  ] );

  const colors = [];
  for ( let i = 0; i < 9; i++ ) {
    var c = new THREE.Color( 0x444444 + ~~( i / 9 ) / 1024 * 0x666666);
    colors.push( c.r, c.g, c.b );
    // colors.push( 1,1,1 );
  };

  birdGeo.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  birdGeo.addAttribute( 'birdColor', new THREE.BufferAttribute( new Float32Array( colors ), 3 ) );
  // birdGeo.computeFaceNormals();
  // birdGeo.computeVertexNormals();
  


  var geometry = new THREE.InstancedBufferGeometry();
  geometry.copy( birdGeo );

  var references = new Float32Array( points * 2 );
  var birdVertex = new Float32Array( points );

  for ( let v = 0; v < triangles * 3; v++ ) {
    // That ~~ is a double NOT bitwise operator.
    // It is used as a faster substitute for Math.floor().
    let i = ~~( v / 3 );
    var x = ( i % WIDTH ) / WIDTH;
    var y = ~~( i / WIDTH ) / WIDTH;

    references[ v * 2 ] = x;
    references[ v * 2 + 1 ] = y;

    birdVertex[ v ] = v % 9;
  }
  console.log('references array', references);

  geometry.addAttribute( 'reference', new THREE.InstancedBufferAttribute( references, 2 ));
  geometry.addAttribute( 'birdVertex', new THREE.InstancedBufferAttribute( birdVertex, 1 ));

  geometry.scale( 0.2, 0.2, 0.2 );

  return geometry;
}








var BirdGeometry = function (width) {
  const WIDTH = width;
  const BIRDS = WIDTH * WIDTH;
  var triangles = BIRDS * 3;
  var points = triangles * 3;

  THREE.BufferGeometry.call( this );

  var vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
  var birdColors = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
  var references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );
  var birdVertex = new THREE.BufferAttribute( new Float32Array( points ), 1 );

  this.addAttribute( 'position', vertices );
  this.addAttribute( 'birdColor', birdColors );
  this.addAttribute( 'reference', references );
  this.addAttribute( 'birdVertex', birdVertex );

  // this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 );

  var v = 0;

  function vertsPush() {
    for ( let i = 0; i < arguments.length; i++ ) {
      vertices.array[ v++ ] = arguments[ i ];
    }
  }

  var wingsSpan = 20;

  for ( var f = 0; f < BIRDS; f++ ) {
    // Body
    vertsPush(
      0, -0, -20,
      0, 4, -20,
      0, 0, 30
    );

    // Left Wing
    vertsPush(
      0, 0, -15,
      -wingsSpan, 0, 0,
      0, 0, 15
    );

    // Right Wing
    vertsPush(
      0, 0, 15,
      wingsSpan, 0, 0,
      0, 0, -15
    );
  }

  for ( let v = 0; v < triangles * 3; v++ ) {
    // ~~ is a double NOT bitwise operator.
    // It is used as a faster substitute for Math.floor().
    let i = ~~( v / 3 );
    var x = ( i % WIDTH ) / WIDTH;
    var y = ~~( i / WIDTH ) / WIDTH;

    var c = new THREE.Color(
      0x444444 +
        ~~( v / 9 ) / BIRDS * 0x666666
    );

    birdColors.array[ v * 3 + 0 ] = c.r;
    birdColors.array[ v * 3 + 1 ] = c.g;
    birdColors.array[ v * 3 + 2 ] = c.b;

    references.array[ v * 2 ] = x;
    references.array[ v * 2 + 1 ] = y;

    birdVertex.array[ v ] = v % 9;
  }

  this.scale( 0.2, 0.2, 0.2 );
};

BirdGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
BirdGeometry.prototype.constructor = BirdGeometry;

module.exports = { BirdGeometry, createBirdInstanceGeometry };
