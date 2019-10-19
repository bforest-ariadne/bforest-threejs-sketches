// #define USE_TRANSLUCENCY
// #define USE_THICKNES_MAP

#ifdef USE_TRANSLUCENCY
  uniform sampler2D thicknessMap;
  uniform float thicknessPower;
  uniform float thicknessScale;
  uniform float thicknessDistortion;
  uniform float thicknessAmbient;
  uniform float thicknessAttenuation;
  uniform vec3 thicknessColor;
  uniform vec2 thicknessRepeat;
  uniform float diffuseColorInfluence;
#endif

#define PHYSICAL

#ifdef PHYSICAL
	#define REFLECTIVITY
	#define CLEARCOAT
	#define TRANSPARENCY
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef TRANSPARENCY
	uniform float transparency;
#endif
#ifdef REFLECTIVITY
	uniform float reflectivity;
#endif
#ifdef CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheen;
#endif
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_normalmap_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
vec3 getLightProbeBackIrradiance( const in vec3 lightProbe[ 9 ], const in GeometricContext geometry ) {
	vec3 worldNormal = inverseTransformDirection( geometry.normal, -viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getLightProbeBackIndirectRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in int maxMIPLevel ) {
  // #ifdef ENVMAP_MODE_REFLECTION
  //   vec3 reflectVec = reflect( -viewDir, normal );
  //   reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
  // #else
  //   vec3 reflectVec = refract( -viewDir, normal, refractionRatio );
  // #endif
  // vec3 reflectVec = reflect( -viewDir, -normal );
  vec3 reflectVec = refract( -viewDir, normal, 1.0 );
  reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
  reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
  float specularMIPLevel = getSpecularMIPLevel( roughness, maxMIPLevel );
  #ifdef ENVMAP_TYPE_CUBE
    vec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );
    #ifdef TEXTURE_LOD_EXT
      vec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );
    #else
      vec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );
    #endif
    envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;
  #elif defined( ENVMAP_TYPE_CUBE_UV )
    vec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );
    vec4 envMapColor = textureCubeUV( envMap, queryReflectVec, roughness );
  #elif defined( ENVMAP_TYPE_EQUIREC )
    vec2 sampleUV;
    sampleUV.y = asin( clamp( reflectVec.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
    sampleUV.x = atan( reflectVec.z, reflectVec.x ) * RECIPROCAL_PI2 + 0.5;
    #ifdef TEXTURE_LOD_EXT
      vec4 envMapColor = texture2DLodEXT( envMap, sampleUV, specularMIPLevel );
    #else
      vec4 envMapColor = texture2D( envMap, sampleUV, specularMIPLevel );
    #endif
    envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;
  #elif defined( ENVMAP_TYPE_SPHERE )
    vec3 reflectView = normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0,0.0,1.0 ) );
    #ifdef TEXTURE_LOD_EXT
      vec4 envMapColor = texture2DLodEXT( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );
    #else
      vec4 envMapColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );
    #endif
    envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;
  #endif
  return envMapColor.rgb * envMapIntensity;
}

void main() {

  #include <clipping_planes_fragment>

  vec4 diffuseColor = vec4( diffuse, opacity );
  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>

  // accumulation
  #include <lights_physical_fragment>
  #include <lights_fragment_begin>

  #ifdef USE_TRANSLUCENCY
    // vec3 thicknessColor = vec3(1.0, 1.0, 1.0);
    vec3 thickness = thicknessColor;
    #ifdef USE_THICKNESS_MAP
      thickness *= texture2D(thicknessMap, vUv * thicknessRepeat).r;
    #endif
    vec3 N = geometry.normal;
    vec3 V = normalize(geometry.viewDir);
    float thicknessCutoff = 0.75;
    float thicknessDecay = 1.0;
    
    #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

      for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

        pointLight = pointLights[ i ];

        vec3 vLightDir = pointLight.position - geometry.position;
        vec3 L = normalize(vLightDir);

        float lightDist = length(vLightDir);
        float lightAtten = punctualLightIntensityToIrradianceFactor(lightDist, pointLight.distance, pointLight.decay);
        
        vec3 LTLight = normalize(L + (N * thicknessDistortion));
        float LTDot = pow(saturate(dot(V, -LTLight)), thicknessPower) * thicknessScale;
        vec3 LT = lightAtten * (LTDot + thicknessAmbient) * thickness;
        #if defined( USE_SHADOWMAP )
          // pointLight.color *= getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar );
        #endif
        vec3 pointLightThickness = pointLight.color * LT * thicknessAttenuation;
        pointLightThickness *= mix( vec3(1.0, 1.0, 1.0), material.diffuseColor, diffuseColorInfluence );
        // reflectedLight.directDiffuse += material.diffuseColor * pointLight.color * LT * thicknessAttenuation;
        reflectedLight.directDiffuse += pointLightThickness;

      }

    #endif

    #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
      

      for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

        rectAreaLight = rectAreaLights[ i ];
        
        vec3 vLightDir = rectAreaLight.position - geometry.position;
        vec3 L = normalize(vLightDir);

        float lightDist = length(vLightDir);
        float lightAtten = punctualLightIntensityToIrradianceFactor(lightDist, thicknessCutoff, thicknessDecay);
        
        vec3 LTLight = normalize(L + (N * thicknessDistortion));
        float LTDot = pow(saturate(dot(V, -LTLight)), thicknessPower) * thicknessScale;
        vec3 LT = lightAtten * (LTDot + thicknessAmbient) * thickness;
        vec3 rectLightThickness = pointLight.color * LT * thicknessAttenuation;
        rectLightThickness *= mix( vec3(1.0, 1.0, 1.0), material.diffuseColor, diffuseColorInfluence );
        // reflectedLight.directDiffuse += material.diffuseColor * rectAreaLight.color * LT * thicknessAttenuation;
        reflectedLight.directDiffuse += rectLightThickness;

      }
    #endif

  #endif

  

  // accumulation continue
  #include <lights_fragment_maps>

  #ifdef USE_TRANSLUCENCY
    vec3 backRadiance = getLightProbeBackIndirectRadiance( geometry.viewDir, geometry.normal, material.specularRoughness, maxMipLevel );
    vec3 tL = -V + N * thicknessDistortion;
    float tD = pow(clamp(dot(V, -tL), 0.0, 1.0), thicknessPower) * thicknessScale;
    vec3 tT = (tD + thicknessAmbient) * thickness;

    vec3 translucentRadiance = backRadiance * tT * thicknessAttenuation;
    translucentRadiance *= mix( vec3(1.0, 1.0, 1.0), material.diffuseColor, diffuseColorInfluence );
    radiance += translucentRadiance;
      #if defined( RE_IndirectDiffuse )
        vec3 backIrradiance = getLightProbeBackIrradiance( lightProbe, geometry );
        backIrradiance = backIrradiance * tT * thicknessAttenuation;
        backIrradiance *= mix( vec3(1.0, 1.0, 1.0), material.diffuseColor, diffuseColorInfluence );
        irradiance += backIrradiance;
      #endif

  #endif
	#include <lights_fragment_end>

  // modulation
  #include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	// this is a stub for the transparency model
	#ifdef TRANSPARENCY
		diffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );
	#endif
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	// gl_FragColor = vec4( backIrradiance, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}