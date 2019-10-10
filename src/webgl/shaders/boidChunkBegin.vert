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

	newPosition = mat3( modelMatrix ) * newPosition;

	mat3 rot = calcLookAtMatrix( vec3(0,0,0), velocity, 0.  );

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
	#if !defined(FLAT_SHADED) 
		// transformedNormal = objectNormal;
		// transformedNormal = maty * matz  * transformedNormal;
		// transformedNormal = rot * transformedNormal;
		// transformedNormal = normalMatrix * transformedNormal;
		vNormal = normalize( normalMatrix * maty * matz  * objectNormal );
	#endif

	newPosition =  maty * matz * newPosition;
	//newPosition += ( pos * 0.1 );
	newPosition += pos;
	transformed = newPosition;



// transformed *= scale.x;
// transformed = ( r * vec4(transformed, 1.0)).xyz;
// transformed = transformed + offset; 