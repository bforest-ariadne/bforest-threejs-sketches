// code partially from  http://www.curious-creature.com/pbr_sandbox/

#extension GL_EXT_shader_texture_lod : enable

precision mediump float;

uniform sampler2D tDiffuse;

uniform int colorGrading; // boolean
uniform sampler2D colorGradingMap;

uniform int applyLevels; // boolean
uniform float inBlack;
uniform float inGamma;
uniform float inWhite;
uniform float outBlack;
uniform float outWhite;

uniform float contrast;
uniform float contrastCenter;
uniform float saturation;

varying vec2 outUV;
varying vec4 outFringeUV;
varying float outFringeIntensity;

float linearToSRGB(float c) {
    return (c <= 0.0031308) ? c * 12.92 : (pow(abs(c), 1.0 / 2.4) * 1.055) - 0.055;
}

vec3 linearToSRGB(vec3 c) {
    return vec3(linearToSRGB(c.r), linearToSRGB(c.g), linearToSRGB(c.b));
}

vec3 colorGradeLUT(vec3 c) {
    // Ad hoc implementation of texture3D() with trilinear filtering
    const float bias = 1.0 / 16.0;
    const float scale = 15.0 / 16.0;
    const vec2 offset = vec2(0.5 / 256.0, 0.5 / 16.0);

    float b = floor(c.b * 14.9999);
    float frac = c.b * 15.0 - b;
    b *= (1.0 / 16.0);

    float u = b + c.r * scale * bias;
    float v = c.g * scale;

    vec3 sample1 = texture2DLodEXT(colorGradingMap, vec2(u, v) + offset, 0.0).rgb;
    vec3 sample2 = texture2DLodEXT(colorGradingMap, vec2(u + bias, v) + offset, 0.0).rgb;

    return mix(sample1, sample2, frac);
}

vec3 adjustLevels(vec3 c) {
    c = pow(max(c - inBlack, 0.0) / (inWhite - inBlack), vec3(inGamma));
    // the next two lines can be ommitted in most cases
    c *= (outWhite - outBlack);
    c += outBlack;
    return min(c, 1.0);
}

vec3 colorFringing() {
    return vec3(texture2DLodEXT(tDiffuse, outFringeUV.xy, 0.0).r,
            texture2DLodEXT(tDiffuse, outFringeUV.zw, 0.0).g,
            texture2DLodEXT(tDiffuse, outUV, 0.0).b);
}

vec3 HDR_ACES(const vec3 x) {
    // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

vec3 tonemap(const vec3 x) {
    return HDR_ACES(x);
}

void main() {
    vec3 c;
    if (outFringeIntensity <= 0.001) {
        c = texture2DLodEXT(tDiffuse, outUV, 0.0).rgb;
    } else {
        c = colorFringing();
    }

    c = linearToSRGB(tonemap(c));

    // clamp required for further processing
    c = min(c, 1.0);

    if (colorGrading >= 1) {
        c = colorGradeLUT(c);
    }

    if (saturation != 1.0) {
        // saturation with HDTV luma
        float luminosity = dot(c, vec3(0.2125, 0.7154, 0.0721));
        c = mix(vec3(luminosity), c, saturation);
    }

    if (contrast != 1.0) {
        c = c * contrast + contrastCenter;
    }

    if (applyLevels >= 1) {
        c = adjustLevels(c);
    }

    gl_FragColor = vec4(c, 1.0);
}