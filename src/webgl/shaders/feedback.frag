uniform sampler2D inputBuffer;
uniform sampler2D feedbackBuffer;
uniform float mixAmount;

varying vec2 vUv;
varying vec2 vUv2;

void main() {

	vec4 c0 = texture2D(inputBuffer, vUv);
	vec4 c1 = texture2D(feedbackBuffer, vUv2);
	c1.rgb = mix(c1.rbg, c0.rgb, c0.rgb*mixAmount);

	gl_FragColor = vec4(clamp(vec3(c1.rgb), vec3(0.0), vec3(1.0)), 1.0);

}