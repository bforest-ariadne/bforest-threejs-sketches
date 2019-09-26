module.exports = function exportGLTF( input, binary = true ) {
  var gltfExporter = new THREE.GLTFExporter();
  var options = {
    onlyVisible: true,
    binary: binary,
    forcePowerOfTwoTextures: true,
    forceIndices: true
  };
  gltfExporter.parse( input, function ( result ) {
    if ( result instanceof ArrayBuffer ) {
      saveArrayBuffer( result, 'scene.glb' );
    } else {
      var output = JSON.stringify( result, null, 2 );
      console.log( output );
      saveString( output, 'scene.gltf' );
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