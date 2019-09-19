uniform sampler2D inputBuffer;
uniform sampler2D feedbackBuffer;
uniform float mixAmount;
uniform vec3 iResolution;

varying vec2 vUv;
varying vec2 vUv2;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

  vec2 vUv3 = fragCoord.xy / iResolution.xy;
  vec2 texel = 1.0 / iResolution.xy;
  
  vec3 uv = texture2D(feedbackBuffer, vUv).xyz;
  
  // float gt = mod(iTime*vUv.x*vUv.y, 2.0*3.1415)*1.0;
  float gt = mod(vUv.x*vUv.y, 2.0*3.1415)*1.0;

  vec2 d1 = vec2(uv.x*vec2(texel.x*sin(gt*uv.z), texel.y*cos(gt*uv.x)));
  vec2 d2 = vec2(uv.y*vec2(texel.x*sin(gt*uv.x), texel.y*cos(gt*uv.y)));
  vec2 d3 = vec2(uv.z*vec2(texel.x*sin(gt*uv.y), texel.y*cos(gt*uv.z)));
  
  float bright = (uv.x+uv.y+uv.z)/3.0+0.5;

  
  float r = texture2D(feedbackBuffer, vUv+d1*bright).x;
  float g = texture2D(feedbackBuffer, vUv+d2*bright).y;
  float b = texture2D(feedbackBuffer, vUv+d3*bright).z;
  
  vec3 uvMix = mix(uv, vec3(r,g,b), 0.2);
  
  vec3 orig = texture2D(inputBuffer, vUv).xyz;
  
  fragColor = vec4(mix(uvMix, orig, mixAmount), 1.0);
}

void main() {

	// vec4 c0 = texture2D(inputBuffer, vUv);
	// vec4 c1 = texture2D(feedbackBuffer, vUv2);
	// c1.rgb = mix(c1.rbg, c0.rgb, mixAmount);

	// gl_FragColor = vec4(clamp(vec3(c1.rgb), vec3(0.0), vec3(1.0)), 1.0);
  // gl_FragColor = vec4( vUv.x, vUv.y, 0.0, 0.0);

  mainImage(gl_FragColor, gl_FragCoord.xy);


}