function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}
function convertRange( value, r1, r2 ) { 
  return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}
// convertRange( 328.17, [ 300.77, 559.22 ], [ 1, 10 ] );

// >>> 1.9541497388276272
function log1(text, arg1) {
  var css = 'background: #ff0000; color: #fff';
  text += " ";
 console.log("%c ".concat(text), css, arg1);
}

function uniqueArray(a) {
  return Array.from(new Set(a));
}
// https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array#9229932

module.exports = {
  clamp,
  convertRange,
  log1,
  uniqueArray
};