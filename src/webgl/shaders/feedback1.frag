uniform sampler2D inputBuffer;
uniform sampler2D feedbackBuffer;
uniform float mixAmount;

varying vec2 vUv;
varying vec2 vUv2;

void main() {

	vec2 uv = vUv * 0.998;

	vec4 sum = texture2D(feedbackBuffer, uv);
	vec4 color = texture2D(feedbackBuffer, uv - sum.gb);
	sum += color * -0.15;

	// sum.rgb = mix(sum.rbg, color.rgb, color.rgb*mixAmount);
	vec4 src = texture2D(inputBuffer, vUv);
	sum.rgb = mix(sum.rgb, src.rgb, mixAmount);

	gl_FragColor = vec4(clamp(vec3(sum.rgb), vec3(0.0), vec3(1.0)), 1.0);

}

// vec2 rotate(vec2 coords, float angle){
// 	float sin_factor = sin(angle );
//     float cos_factor = cos(angle );
//     coords = vec2((coords.x - 0.5) , coords.y - 0.5) * mat2(cos_factor, sin_factor, -sin_factor, cos_factor);
//     coords += 0.5;
//     return coords;
// }

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 res = iResolution.xy;
//     float t = iTime*0.01;
//     vec2 tc = fragCoord / res;
//     vec2 uv = tc;
    
//     //zoom 
//     uv *= 0.998;
    
//     //rotation
//     //uv = rotate(uv, 0.0015);
    
//     //vec2 step = 1.0 / res;
    
    
//     vec4 sum = texture(iChannel1, uv);
    
 
//     vec4 color = texture(iChannel1, uv - sum.gb);
//     sum += color * -0.15;
    
//     vec4 src = texture(iChannel0, tc);
//     sum.rgb = mix(sum.rgb, src.rgb, src.rgb*0.15);

//     fragColor = vec4(clamp(vec3(sum.rgb), vec3(0.0), vec3(1.0)), 1.0);
    

// }