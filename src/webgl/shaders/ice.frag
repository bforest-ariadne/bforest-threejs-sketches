#define USE_TRANSLUCENCY
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
        reflectedLight.directDiffuse += material.diffuseColor * pointLight.color * LT * thicknessAttenuation;

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
        reflectedLight.directDiffuse += material.diffuseColor * rectAreaLight.color * LT * thicknessAttenuation;
      }
    #endif

  #endif

  // accumulation continue
  #include <lights_fragment_maps>
	#include <lights_fragment_end>

  // modulation
  #include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	// this is a stub for the transparency model
	#ifdef TRANSPARENCY
		diffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );
	#endif
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}