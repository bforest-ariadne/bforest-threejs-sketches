#include <begin_vertex>

// mat4 r = rotateXYZ();

vec4 tmpPos = texture2D( texturePosition, reference );
vec3 pos = tmpPos.xyz;
vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);

vec3 newPosition = position;

// if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
// 	// flap wings
// 	newPosition.y = sin( tmpPos.w ) * 5.;
// }

// float squash = length( pos - (velocity * pos) ) * 0.003;
float squash = length( velocity.xz ) * 2.;
// test = pow(squash, 3.);
squash = clamp( pow(squash, 3.), 1., 2. );
// squash *= 10.0;

newPosition = mat3( modelMatrix ) * newPosition;

velocity.z *= -1.;
float xz = length( velocity.xz );
float xyz = 1.;
float x = sqrt( 1. - velocity.y * velocity.y );

float cosry = velocity.x / xz;
float sinry = velocity.z / xz;

float cosrz = x / xyz;
float sinrz = velocity.y / xyz;

mat3 maty =  mat3(
	cosry, 0, -sinry,
	0    , 1, 0     ,
	sinry, 0, cosry

);

mat3 matz =  mat3(
	cosrz , sinrz, 0,
	-sinrz, cosrz, 0,
	0     , 0    , 1
);


// #if !defined(FLAT_SHADED) && defined(STANDARD) 
#if !defined(FLAT_SHADED) && !defined(MESH_DEPTH_SHADER)
	vNormal = normalize( normalMatrix * maty * matz  * objectNormal );
#endif

newPosition =  maty * matz * ( newPosition *  mix( vec3(1.),vec3(squash,1. / squash,1. / squash), squashiness) );
// newPosition = maty * matz * newPosition; 
newPosition += pos;
transformed = newPosition;
