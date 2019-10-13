// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
function createReferencesAttribute( birds ) {
  let WIDTH = Math.sqrt( birds );
  var references = new Float32Array( birds * 2 );

  for ( let i = 0; i < birds; i++ ) {
    var x = ( i % WIDTH ) / WIDTH;
    var y = ~~( i / WIDTH ) / WIDTH;
    references[ i * 2 ] = x;
    references[ i * 2 + 1 ] = y;
  }

  return new THREE.InstancedBufferAttribute( references, 2 );
}

function createBirdInstanceGeometry( birds ) {
  let WIDTH = Math.sqrt( birds );
  let triangles = birds * 3;
  let points = triangles * 3;

  let birdGeo = new BirdGeometry(1);

  let geometry = new THREE.InstancedBufferGeometry();
  // geometry.copy( birdGeo );
  geometry.attributes = birdGeo.attributes;

  let referenceBirdGeo = new BirdGeometry( birds );

  let references = referenceBirdGeo.attributes.reference.array;
  
  geometry.addAttribute( 'reference', new THREE.InstancedBufferAttribute( references, 2 ));

  return geometry;
}

// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
var BirdGeometry = function (birds) {
  var WIDTH = Math.sqrt( birds );
  var triangles = birds * 3;
  var points = triangles * 3;

  THREE.BufferGeometry.call( this );

  var vertices = new THREE.Float32BufferAttribute( new Float32Array( points * 3 ), 3 );
  var birdColors = new THREE.Float32BufferAttribute( new Float32Array( points * 3 ), 3 );
  var references = new THREE.Float32BufferAttribute( new Float32Array( points * 2 ), 2 );
  var birdVertex = new THREE.Float32BufferAttribute( new Float32Array( points ), 1 );

  this.addAttribute( 'position', vertices );
  this.addAttribute( 'birdColor', birdColors );
  this.addAttribute( 'reference', references );
  this.addAttribute( 'birdVertex', birdVertex );

  // this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 );

  var v = 0;

  function vertsPush() {
    for ( var i = 0; i < arguments.length; i++ ) {
      vertices.array[ v++ ] = arguments[ i ];
    }
  }

  var wingsSpan = 20;

  for ( var f = 0; f < birds; f++ ) {
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

  // let c = new THREE.Color();

  for ( let v = 0; v < triangles * 3; v++ ) {
    var i = ~~( v / 3 );
    var x = ( i % WIDTH ) / WIDTH;
    var y = ~~( i / WIDTH ) / WIDTH;

    let col = 0.8;

    if ( v <= 3 ) {
      col = 0.4;
    } else if ( v <= 6 ) {
      col = 0.6;
    }

    birdColors.array[ v * 3 + 0 ] = col;
    birdColors.array[ v * 3 + 1 ] = col;
    birdColors.array[ v * 3 + 2 ] = col;

    references.array[ v * 2 ] = x;
    references.array[ v * 2 + 1 ] = y;

    birdVertex.array[ v ] = v % 9;
  }

  this.scale( 0.2, 0.2, 0.2 );
};

BirdGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
BirdGeometry.prototype.constructor = BirdGeometry;

module.exports = { BirdGeometry, createBirdInstanceGeometry, createReferencesAttribute };
