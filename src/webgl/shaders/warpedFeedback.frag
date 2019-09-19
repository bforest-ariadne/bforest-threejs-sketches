// https://www.shadertoy.com/view/4syyDK
#define PI     3.14159265358
#define TWO_PI 6.28318530718
#define feedbackSpeed	0.002

uniform sampler2D inputBuffer;
uniform sampler2D feedbackBuffer;
uniform float mixAmount;
uniform float iTime;
uniform vec3 iResolution;

varying vec2 vUv;
varying vec2 vUv2;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // get webcam color
   	vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 uvCam = fragCoord/iResolution.xy;
    uvCam.x = 1. - uvCam.x; // mirror camera
    vec4 texColor = texture2D(inputBuffer, uvCam);
    

    // oscillate or manually control brightness threshold for seed pixels
    float brightnessThreshold = 0.6 + 0.4 * sin(iTime);
    // if(iMouse.z > 0.) brightnessThreshold = iMouse.x / iResolution.x;
    if(luma(texColor.rgb) > brightnessThreshold) {
        // if bright enough, modify color & draw seed pixels on top
        fragColor = vec4(
            texColor.r + 0.25 * sin(iTime),
            texColor.g + 0.25 * sin(iTime * 0.8),
            texColor.b + 0.25 * sin(iTime * 0.7),
            1.
            );
    } else {
        // otherwise, run feedback
        // turn color into a rotation for feedback smearing
        float colorToRads = TWO_PI * luma(texColor.rgb) * 3.;
        uv += vec2(cos(colorToRads) * feedbackSpeed, sin(colorToRads) * feedbackSpeed);
		// vec4 feedback = texture2D(feedbackBuffer, uv);
    fragColor = 1.3 * mix(texture2D(feedbackBuffer, uv), texture2D(inputBuffer, uvCam), mixAmount);
    }
}

void main() {

	// vec4 c0 = texture2D(inputBuffer, vUv);
	// vec4 c1 = texture2D(feedbackBuffer, vUv2);
	// c1.rgb = mix(c1.rbg, c0.rgb, mixAmount);

	// gl_FragColor = vec4(clamp(vec3(c1.rgb), vec3(0.0), vec3(1.0)), 1.0);
  // gl_FragColor = vec4( vUv.x, vUv.y, 0.0, 0.0);

  mainImage(gl_FragColor, gl_FragCoord.xy);


}