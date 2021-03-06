
module.exports = class ParallaxOclusionMaterialModifier {
  constructor() {
    this.modes = {
      none: 'NO_PARALLAX',
      basic: 'USE_BASIC_PARALLAX',
      steep: 'USE_STEEP_PARALLAX',
      occlusion: 'USE_OCLUSION_PARALLAX', // a.k.a. POM
      relief: 'USE_RELIEF_PARALLAX'
    };
    this.guiModes = {
      none: 'none',
      basic: 'basic',
      steep: 'steep',
      occlusion: 'occlusion', // a.k.a. POM
      relief: 'relief'
    };
    this.parallaxOclusionFunctions = `
    #include <clipping_planes_pars_fragment>
    uniform float parallaxScale;
    uniform float parallaxMinLayers;
    uniform float parallaxMaxLayers;

    #if defined(USE_BUMPMAP) && defined(STANDARD)
    
    #ifdef USE_BASIC_PARALLAX
    
      vec2 parallaxMap( in vec3 V ) {
    
        float initialHeight = texture2D( bumpMap, vUv ).r;
    
        // No Offset Limitting: messy, floating output at grazing angles.
        //vec2 texCoordOffset = parallaxScale * V.xy / V.z * initialHeight;
    
        // Offset Limiting
        vec2 texCoordOffset = parallaxScale * V.xy * initialHeight;
        return vUv - texCoordOffset;
    
      }
    
    #else
    
      vec2 parallaxMap( in vec3 V ) {
    
        // Determine number of layers from angle between V and N
        float numLayers = mix( parallaxMaxLayers, parallaxMinLayers, abs( dot( vec3( 0.0, 0.0, 1.0 ), V ) ) );
    
        float layerHeight = 1.0 / numLayers;
        float currentLayerHeight = 0.0;
        // Shift of texture coordinates for each iteration
        vec2 dtex = parallaxScale * V.xy / V.z / numLayers;
    
        vec2 currentTextureCoords = vUv;
    
        float heightFromTexture = texture2D( bumpMap, currentTextureCoords ).r;
    
        // while ( heightFromTexture > currentLayerHeight )
        // Infinite loops are not well supported. Do a large finite
        // loop, but not too large, as it slows down some compilers.
        for ( int i = 0; i < 30; i += 1 ) {
          if ( heightFromTexture <= currentLayerHeight ) {
            break;
          }
          currentLayerHeight += layerHeight;
          // Shift texture coordinates along vector V
          currentTextureCoords -= dtex;
          heightFromTexture = texture2D( bumpMap, currentTextureCoords ).r;
        }
    
        #ifdef USE_STEEP_PARALLAX
    
          return currentTextureCoords;
    
        #elif defined( USE_RELIEF_PARALLAX )
    
          vec2 deltaTexCoord = dtex / 2.0;
          float deltaHeight = layerHeight / 2.0;
    
          // Return to the mid point of previous layer
          currentTextureCoords += deltaTexCoord;
          currentLayerHeight -= deltaHeight;
    
          // Binary search to increase precision of Steep Parallax Mapping
          const int numSearches = 5;
          for ( int i = 0; i < numSearches; i += 1 ) {
    
            deltaTexCoord /= 2.0;
            deltaHeight /= 2.0;
            heightFromTexture = texture2D( bumpMap, currentTextureCoords ).r;
            // Shift along or against vector V
            if( heightFromTexture > currentLayerHeight ) { // Below the surface
    
              currentTextureCoords -= deltaTexCoord;
              currentLayerHeight += deltaHeight;
    
            } else { // above the surface
    
              currentTextureCoords += deltaTexCoord;
              currentLayerHeight -= deltaHeight;
    
            }
    
          }
          return currentTextureCoords;
    
        #elif defined( USE_OCLUSION_PARALLAX )
    
          vec2 prevTCoords = currentTextureCoords + dtex;
    
          // Heights for linear interpolation
          float nextH = heightFromTexture - currentLayerHeight;
          float prevH = texture2D( bumpMap, prevTCoords ).r - currentLayerHeight + layerHeight;
    
          // Proportions for linear interpolation
          float weight = nextH / ( nextH - prevH );
    
          // Interpolation of texture coordinates
          return prevTCoords * weight + currentTextureCoords * ( 1.0 - weight );
    
        #else // NO_PARALLAX
    
          return vUv;
    
        #endif
    
      }
    #endif
    
    vec2 perturbUv( vec3 surfPosition, vec3 surfNormal, vec3 viewPosition ) {
    
      vec2 texDx = dFdx( vUv );
      vec2 texDy = dFdy( vUv );
    
      vec3 vSigmaX = dFdx( surfPosition );
      vec3 vSigmaY = dFdy( surfPosition );
      vec3 vR1 = cross( vSigmaY, surfNormal );
      vec3 vR2 = cross( surfNormal, vSigmaX );
      float fDet = dot( vSigmaX, vR1 );
    
      vec2 vProjVscr = ( 1.0 / fDet ) * vec2( dot( vR1, viewPosition ), dot( vR2, viewPosition ) );
      vec3 vProjVtex;
      vProjVtex.xy = texDx * vProjVscr.x + texDy * vProjVscr.y;
      vProjVtex.z = dot( surfNormal, viewPosition );
    
      return parallaxMap( vProjVtex );
    }
    #endif`;
  }

  modifyMeshMaterial( mesh ) {
    const material = mesh.material;
    if ( !material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial ) {
      console.warn( 'this method has only been tested with THREE.MeshStandardMaterial and THREE.MeshPhysicalMaterial');
      return;
    }

    // temporary place for shaderUniforms object
    material.userData.parallaxOclusion = {};
    material.userData.parallaxOclusion.shaderUniforms = {
      parallaxScale: {value: -0.01},
      parallaxMinLayers: {value: 1},
      parallaxMaxLayers: {value: 30}
    };
    material.userData.parallaxOclusion.parallaxMode = 'occlusion';
    material.userData.parallaxOclusion.modes = this.modes;

    const previousOnBeforeCompile = material.onBeforeCompile;

    material.defines[ this.modes.occlusion ] = '';

    // add parallax properties to material object for easier access
    Object.defineProperty(material, 'parallaxScale', {
      get() {
        return this.userData.parallaxOclusion.shaderUniforms.parallaxScale.value;
      },
      set( value ) {
        this.userData.parallaxOclusion.shaderUniforms.parallaxScale.value = value;
      }
    });

    Object.defineProperty(material, 'parallaxMinLayers', {
      get() {
        return this.userData.parallaxOclusion.shaderUniforms.parallaxMinLayers.value;
      },
      set( value ) {
        this.userData.parallaxOclusion.shaderUniforms.parallaxMinLayers.value = value;
      }
    });

    Object.defineProperty(material, 'parallaxMaxLayers', {
      get() {
        return this.userData.parallaxOclusion.shaderUniforms.parallaxMaxLayers.value;
      },
      set( value ) {
        this.userData.parallaxOclusion.shaderUniforms.parallaxMaxLayers.value = value;
      }
    });

    Object.defineProperty(material, 'parallaxMode', {
      get() {
        // return this.userData.parallaxOclusion.parallaxMode;
        return this.userData.parallaxOclusion.parallaxMode;
      },
      set( value ) {
        const defines = {};
        for ( let [ key, value ] of Object.entries(this.defines) ) {
          if ( !key.includes( 'PARALLAX' ) ) defines[ key ] = value;
        }
        this.userData.parallaxOclusion.parallaxMode = value;
        defines[ this.userData.parallaxOclusion.modes[ value ] ] = '';
        this.defines = defines;
        this.needsUpdate = true;
      }
    });

    material.onBeforeCompile = (shader, renderer) => {
      // call previous onBefore Compile if one existed
      previousOnBeforeCompile( shader, renderer );

      // setup uniforms
      shader.uniforms.parallaxScale = material.userData.parallaxOclusion.shaderUniforms.parallaxScale;
      shader.uniforms.parallaxMinLayers = material.userData.parallaxOclusion.shaderUniforms.parallaxMinLayers;
      shader.uniforms.parallaxMaxLayers = material.userData.parallaxOclusion.shaderUniforms.parallaxMaxLayers;

      // add our modified vUv variable vUvParallax to top of shader
      shader.fragmentShader = `
      vec2 vUvParallax;
      ` + shader.fragmentShader;

      // string.replace() but for all occurances of a string
      const replaceAll = function(target, search, replacement) {
        return target.split(search).join(replacement);
      };

      // shader chunks that need vUv replaed with vUvParallax
      const uvReplaceChunks = [
        'normalmap_pars_fragment',
        'map_fragment',
        'alphamap_fragment',
        'roughnessmap_fragment',
        'metalnessmap_fragment',
        'normal_fragment_maps',
        'clearcoat_normal_fragment_maps',
        'emissivemap_fragment'
      ];

      // replace vUv where necessary
      for ( let chunkName of uvReplaceChunks ) {
        shader.fragmentShader = shader.fragmentShader.replace(
          `#include <${chunkName}>`,
          replaceAll( THREE.ShaderChunk[chunkName], 'vUv', 'vUvParallax')
        );
      }

      // remove bumpMap shader code but keep bumpMap uniform
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <bumpmap_pars_fragment>`,
        `
        #ifdef USE_BUMPMAP
          uniform sampler2D bumpMap;
        #endif
      `);

      // make sure original bumpMap code does not execute
      const normalFragmentMaps = THREE.ShaderChunk.normal_fragment_maps.replace(`USE_BUMPMAP`, `USE_BUMPMAPOLD`);
      shader.fragmentShader = shader.fragmentShader.replace(`#include <normal_fragment_maps>`, normalFragmentMaps);

      // workaround for flat shading - calculating normal early
      let normalFragmentBeginReplace = THREE.ShaderChunk['normal_fragment_begin'].replace(
        `vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );`,
        ``
      );
      normalFragmentBeginReplace = normalFragmentBeginReplace.replace(
        `vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );`,
        ``
      );
      normalFragmentBeginReplace = normalFragmentBeginReplace.replace(
        `vec3 normal = normalize( cross( fdx, fdy ) );`,
        ``
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <normal_fragment_begin>`,
        normalFragmentBeginReplace
      );

      // add parallax oclusion functions to shader. Code taken from three.js/examples/shaders/ParallaxShader.js
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <clipping_planes_pars_fragment>`,
        this.parallaxOclusionFunctions
      );

      // execute parallax occlusion functions in main()
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <clipping_planes_fragment>`,
        `
        #include <clipping_planes_fragment>

        #ifdef FLAT_SHADED
          // Workaround for Adreno/Nexus5 not able able to do dFdx( vViewPosition ) ...
          vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );
          vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );
          vec3 normal = normalize( cross( fdx, fdy ) );
          #if defined(USE_BUMPMAP) && defined(STANDARD)
            vec3 vNormal = vec3( normal );
          #endif
        #endif

        #if defined(USE_BUMPMAP) && defined(STANDARD)
          vUvParallax = perturbUv( -vViewPosition, normalize( vNormal ), normalize( vViewPosition ) );
        #endif
        `
      );
    };
  }

  addGui( mesh, gui ) {
    const material = mesh.material;
    let f = gui.addFolder({title: `${mesh.name} - ${material.name}: Parallax`, expanded: false});

    f.addInput( material, 'parallaxScale', {
      min: -0.05,
      max: 0.05,
      step: 0.001,
      label: 'scale'
    });

    f.addInput( material, 'parallaxMinLayers', {
      min: 1,
      max: 30,
      step: 1,
      label: 'min layers'
    });

    f.addInput( material, 'parallaxMaxLayers', {
      min: 1,
      max: 30,
      step: 1,
      label: 'max layers'
    });

    f.addInput(material, 'parallaxMode', {
      options: this.guiModes
    });
  }
};
