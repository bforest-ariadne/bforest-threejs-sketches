const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicSSAO');
const query = require('../../util/query');
const defined = require('defined');
const { createMaterial, materialAssets } = require('../materials/createPbrMaterial');

const name = 'pbrtest';

// const textureCompression = webgl.mobile ? 'PVRTC' : 'DXT1';

if ( defined( query.scene ) && query.scene.toLowerCase() === name ) {
  assets.queue({
    url: 'assets/textures/studio_small_02_1024/',
    key: 'env',
    envMap: true,
    hdr: true,
    pbr: true
  });

  assets.queue({
    url: `assets/materials/marbleFloor.glb`,
    key: 'marbleFloor'
  });

  assets.queue({
    url: 'assets/materials/iron1.glb',
    key: 'iron2'
  });

  for ( let i in materialAssets ) {
    assets.queue( materialAssets[i] );
  }
}

module.exports = class PbrTest extends SketchScene {
  constructor () {
    super(name);
    this.animate = true;
  }
  init() {
    this.pars = {
      envMapIntensity: 0.12,
      spotlightIntensity: 100,
      parallaxMode: 'USE_OCLUSION_PARALLAX'
      // envMapIntensity: 0.2
    };
    this.controlsInit();
    this.controls.distance = 10;
    this.controls.position = [ 8, 2, -7.4 ];
    let env = assets.get('env');

    this.useBufferGeo = true;
    this.N = 100;
    const smooth = true;

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    // webgl.scene.background = env.cubeMap;
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;

    postProcessSetup( false );

    let ironMaterial;

    assets.get('iron2').scene.traverse(child => {
      if (child.isMesh && child.material) {
        ironMaterial = child.material;
      }
    });

    ironMaterial = createMaterial(env.target.texture);

    const object = new THREE.Object3D();
    this.object = object;
    let mesh;

    ironMaterial.envMap = env.target.texture;
    ironMaterial.needsUpdate = true;

    global.mat = ironMaterial;

    // ground

    let marble1Mat;
    assets.get('marbleFloor').scene.traverse(child => {
      if (child.isMesh && child.material) {
        marble1Mat = child.material;
      }
    });

    marble1Mat.envMap = env.target.texture;
    marble1Mat.side = THREE.DoubleSide;
    marble1Mat.needsUpdate = true;

    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 40, 40, 40, 40 ),
      marble1Mat
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -4;
    plane.receiveShadow = true;
    plane.name = 'ground';
    plane.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      material.side = THREE.DoubleSide;
    };
    this.add( plane );
    this.plane = plane;

    // spotlight
    const spotlight = new THREE.SpotLight( 0xffffff, 100, 0, Math.PI / 5, 0.3 );
    spotlight.position.set( 5, 12, 5 );
    spotlight.target.position.set( 0, 0, 0 );
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 1;
    spotlight.shadow.camera.far = 30;
    spotlight.distance = 30;
    spotlight.name = 'spotlight';
    this.add( spotlight );
    this.spotlight = spotlight;

    // this.lightHelper = new THREE.SpotLightHelper( spotlight );
    // this.add( this.lightHelper );

    // let testMat = ironMaterial.clone();

    const testBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 2, 2, 2),
      ironMaterial
    );
    testBox.position.set( 3.0, 2.0, -2.0 );
    testBox.receiveShadow = true;
    testBox.castShadow = true;
    global.box = testBox;
    this.add( testBox );

    // this.shadowCameraHelper = new THREE.CameraHelper( spotlight.shadow.camera );
    // this.add( this.shadowCameraHelper );

    // this.add( new THREE.CameraHelper( spotlight.shadow.camera ) );

    // this.spotlightShadowMapViewer = new THREE.ShadowMapViewer( spotlight );
    // this.spotlightShadowMapViewer.size.set( 128, 128 );
    // this.spotlightShadowMapViewer.position.set( 10, 70 );
    // this.spotlightShadowMapViewer.update();
    // webgl.on( 'afterRender', () => {
    //   if ( defined( this.spotlight.shadow.map ) ) this.spotlightShadowMapViewer.render( webgl.renderer );
    // });

    let bufferGeometry;
    if ( smooth ) {
      // bufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 9, 9, 9);
      bufferGeometry = new THREE.SphereBufferGeometry(1, 15, 15);
      ironMaterial.flatShading = false;
    } else {
      bufferGeometry = new THREE.SphereBufferGeometry(1, 4, 4);
      // bufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 9, 9, 9);
      ironMaterial.flatShading = true;
    }

    const positions = [];
    const orientations = [];
    const scales = [];
    const radius = [];
    const rotationXYZ = [];
    let vector3 = new THREE.Vector3();
    let x, y, z;


    this.moveQ = new THREE.Quaternion( 0.5, 0.5, 0.5, 0.0 ).normalize();
    this.tmpQ = new THREE.Quaternion();
    this.currentQ = new THREE.Quaternion();

    for (let i = 0; i < this.N; ++i) {
      if ( this.useBufferGeo ) {
        // offsets

        vector3.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        vector3.multiplyScalar(Math.random() * 10);
        positions.push( vector3.x, vector3.y, vector3.z );

        // rotations

        rotationXYZ.push(
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1,
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1,
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1
        );

        // scale

        x = y = z = Math.random();
        scales.push( x, y, z );

        // smooth radius

        radius.push(Math.min(x, Math.min(y, z)));
      } else {
        mesh = new THREE.Mesh(bufferGeometry, ironMaterial);
        mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        mesh.position.multiplyScalar(Math.random() * 10);
        mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        mesh.scale.multiplyScalar(Math.random());
        object.add(mesh);
      }
    }

    if ( this.useBufferGeo ) {
      this.log('userbuffergeo');
      this.geometry = new THREE.InstancedBufferGeometry();
      this.geometry.copy( bufferGeometry );

      this.orientationAttribute = new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ).setDynamic( true );

      this.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array(positions), 3 ) );
      // this.geometry.addAttribute( 'orientation', this.orientationAttribute );
      this.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array(scales), 3 ) );
      this.geometry.addAttribute( 'radius', new THREE.InstancedBufferAttribute( new Float32Array(radius), 1 ) );
      this.geometry.addAttribute( 'rotation', new THREE.InstancedBufferAttribute( new Float32Array(rotationXYZ), 3 ) );

      // modify material

      this.shaderUniforms = {
        time: {value: 0},
        speed: {value: 1},
        // radius: {value: 1},
        parallaxScale: {value: -0.01},
        parallaxMinLayers: {value: 1},
        parallaxMaxLayers: {value: 30}
      };

      ironMaterial.defines['NO_PARALLAX'] = '';
      ironMaterial.onBeforeCompile = shader => {
        shader.uniforms.time = this.shaderUniforms.time;
        shader.uniforms.speed = this.shaderUniforms.speed;
        // shader.uniforms.radius = this.shaderUniforms.radius;
        shader.uniforms.parallaxScale = this.shaderUniforms.parallaxScale;
        shader.uniforms.parallaxMinLayers = this.shaderUniforms.parallaxMinLayers;
        shader.uniforms.parallaxMaxLayers = this.shaderUniforms.parallaxMaxLayers;

        shader.vertexShader = `
        uniform float time;
        uniform float speed;
      
        attribute vec3 offset;
        attribute vec4 orientation;
        attribute vec3 scale;
        attribute float radius;

        attribute vec3 rotation;

        mat4 rotationMatrix(vec3 axis, float angle)
        {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;
      
            return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                        0.0,                                0.0,                                0.0,                                1.0);
        }
        
        mat4 rotateXYZ() {
          return rotationMatrix(vec3(1, 0, 0), rotation.x * time * speed) * rotationMatrix(vec3(0, 1, 0), rotation.y * time * speed) * rotationMatrix(vec3(0, 0, 1), rotation.z * time * speed) ;
        }
        
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          `#include <begin_vertex>`,
          /* glsl */`
          #include <begin_vertex>

          mat4 r = rotateXYZ();

        #if !defined(FLAT_SHADED)
          
          #ifdef STANDARD
            // re-compute normals for correct shadows and reflections
            // objectNormal = all(equal(p, transformed)) ? normal : normalize(position); 
            // transformedNormal = normalize(normalMatrix * normal);

            // vNormal = (vec4(transformedNormal, 1.0) * r).xyz;
          #endif
        #endif

        #if !defined(FLAT_SHADED) && defined(STANDARD)
          transformedNormal = objectNormal;
          transformedNormal = mat3( r ) * transformedNormal;
          transformedNormal = normalMatrix * transformedNormal;
          vNormal = normalize( transformedNormal );
        #endif
        
        //transformed *= scale.x;
        transformed = ( r * vec4(transformed, 1.0)).xyz;
        transformed = transformed + offset; 

          `
        );

        shader.fragmentShader = `
        vec2 vUvParallax;
        ` + shader.fragmentShader;

        const replaceAll = function(target, search, replacement) {
          return target.split(search).join(replacement);
        };

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

        for ( let chunkName of uvReplaceChunks ) {
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <${chunkName}>`,
            replaceAll( THREE.ShaderChunk[chunkName], 'vUv', 'vUvParallax')
          );
        }

        shader.fragmentShader = shader.fragmentShader.replace( 
          `#include <bumpmap_pars_fragment>`,
          `
          #ifdef USE_BUMPMAP
            uniform sampler2D bumpMap;
          #endif
          `);

        const normalFragmentMaps = THREE.ShaderChunk.normal_fragment_maps.replace(`USE_BUMPMAP`, `USE_BUMPMAPOLD`);
        shader.fragmentShader = shader.fragmentShader.replace(`#include <normal_fragment_maps>`, normalFragmentMaps);

        shader.fragmentShader = shader.fragmentShader.replace(
          `#include <clipping_planes_pars_fragment>`,
          `
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
          #endif
          
        `);

        shader.fragmentShader = shader.fragmentShader.replace(
          `#include <clipping_planes_fragment>`,
          `
          #include <clipping_planes_fragment>
          #if defined(USE_BUMPMAP) && defined(STANDARD)
            vUvParallax = perturbUv( -vViewPosition, normalize( vNormal ), normalize( vViewPosition ) );
          #endif
          `
        );
      };
      

      // custom depth material - required for instanced shadows
      var customDepthMaterial = new THREE.MeshDepthMaterial();
      customDepthMaterial.onBeforeCompile = ironMaterial.onBeforeCompile;
      customDepthMaterial.depthPacking = THREE.RGBADepthPacking;

      mesh = new THREE.Mesh( this.geometry, ironMaterial );
      mesh.name = 'instanced mesh';
      mesh.customDepthMaterial = customDepthMaterial;
      mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
        material.onBeforeCompile = ironMaterial.onBeforeCompile;
        material.side = ironMaterial.side;
      };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      global.mesh = mesh;
      object.add( mesh );
    }

    this.add(object);
    object.scale.multiplyScalar(0.36);

    gui.addInput( this.pars, 'spotlightIntensity', {
      min: 0.0,
      max: 200,
      step: 1,
      label: 'spotlight level'
    }).on( 'change', () => {
      this.spotlight.intensity = this.pars.spotlightIntensity;
    });

    gui.addInput( this.pars, 'envMapIntensity', {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'env level'
    }).on( 'change', () => {
      this.adjustEnvIntensity();
    });

    let f = gui.addFolder({title: 'Parallax'});

    f.addInput( this.shaderUniforms.parallaxScale, 'value', {
      min: -0.01,
      max: 0.01,
      step: 0.001,
      label: 'scale'
    }).on( 'change', () => {
      // this.adjustEnvIntensity();
    });

    f.addInput( this.shaderUniforms.parallaxMinLayers, 'value', {
      min: 1,
      max: 30,
      step: 1,
      label: 'min layers'
    }).on( 'change', () => {
      // this.adjustEnvIntensity();
    });

    f.addInput( this.shaderUniforms.parallaxMaxLayers, 'value', {
      min: 1,
      max: 30,
      step: 1,
      label: 'max layers'
    }).on( 'change', () => {
      // this.adjustEnvIntensity();
    });

    f.addInput(this.pars, 'parallaxMode', {
      options: {
        none: 'NO_PARALLAX',
        basic: 'USE_BASIC_PARALLAX',
        steep: 'USE_STEEP_PARALLAX',
        occlusion: 'USE_OCLUSION_PARALLAX', // a.k.a. POM
        relief: 'USE_RELIEF_PARALLAX'
      }
    }).on( 'change', value => {
      // this.adjustEnvIntensity();
      ironMaterial.defines = {STANDARD: ''};
      ironMaterial.defines[ value ] = '';
      ironMaterial.needsUpdate = true;

    });

    this.adjustEnvIntensity();
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    if ( defined( this.lightHelper ) ) this.lightHelper.update();
    if ( defined( this.shadowCameraHelper ) ) this.shadowCameraHelper.update();

    if ( !this.animate ) return;

    this.object.rotation.x += delta * 0.2;
    this.object.rotation.y += delta * 0.3;

    if ( defined( this.shaderUniforms ) ) this.shaderUniforms.time.value = now * 8;
  }

  adjustEnvIntensity( value ) {
    if ( defined( value, false ) ) this.pars.envMapIntensity = value;
    this.traverse( child => {
      if ( defined( child.material, false) && defined( child.material.envMap, false ) ) {
        child.material.envMapIntensity = this.pars.envMapIntensity;
      }
    });
  }

  onResize() {
    if ( defined( this.shadowCameraHelper ) ) this.spotlightShadowMapViewer.updateForWindowResize();
  }

  onKeydown(ev) {
    if ( ev.keyCode === 32 && ev.shiftKey ) {
      this.animate = !this.animate;
    }
  }
};
