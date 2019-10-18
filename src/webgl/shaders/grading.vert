// code partially from  http://www.curious-creature.com/pbr_sandbox/
precision highp float;

uniform float fringeIntensity;
uniform vec2 resolution;

varying vec2 outUV;
varying vec4 outFringeUV;
varying float outFringeIntensity;

void main() {
    outUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // sRGB primaries wavelengths, in nm, as defined here:
    // http://www-rohan.sdsu.edu/~aty/explain/optics/rendering.html
    const float waveLengthR = 611.3;
    const float waveLengthG = 549.1;
    const float waveLengthB = 464.3;

    const float scaleR = (waveLengthR - waveLengthB) * 0.005;
    const float scaleG = (waveLengthG - waveLengthB) * 0.005;
    
    outFringeIntensity = fringeIntensity * 0.01;

    outFringeUV.xy = (uv - 0.5) / (1.0 + outFringeIntensity * scaleR) + 0.5;
    outFringeUV.zw = (uv - 0.5) / (1.0 + outFringeIntensity * scaleG) + 0.5;
}
