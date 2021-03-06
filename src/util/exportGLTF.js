module.exports = function exportGLTF( input, options = {} ) {
  var gltfExporter = new THREE.GLTFExporter();

  // var options = {
  //   onlyVisible: true,
  //   binary: binary,
  //   forcePowerOfTwoTextures: true,
  //   forceIndices: true,
  //   material: false,
  //   embedImages: false
  // };

  var name = 'scene';
  name = input.name !== '' ? input.name : name;
  name = options.material && input.material.name !== '' ? input.material.name : name;
  name = typeof options.name !== 'undefined' ? options.name : name;

  if ( options.material ) {
    const geo = new THREE.PlaneBufferGeometry( 10, 10, 1, 1 );
    const mesh = input.clone();
    mesh.geometry = geo;
    input = mesh;
  }
  gltfExporter.parse( input, function ( result ) {
    if ( result instanceof ArrayBuffer ) {
      saveArrayBuffer( result, name + '.glb' );
    } else {
      var output = JSON.stringify( result, null, 2 );
      console.log( output );
      saveString( output, name + '.gltf' );
    }
  }, options );
};

var link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link ); // Firefox workaround, see #6594

function save( blob, filename ) {
  link.href = URL.createObjectURL( blob );
  link.download = filename;
  link.click();
  // URL.revokeObjectURL( url ); breaks Firefox...
}

function saveString( text, filename ) {
  save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}
function saveArrayBuffer( buffer, filename ) {
  save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}