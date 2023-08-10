attribute vec2 position;
attribute float time;
attribute float speed;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform sampler2D surfaceMap;
uniform vec2 dimensions;
uniform float heightScale;
uniform float maxTime;
uniform float currTime;
uniform vec3 color0;
uniform vec3 color1;

varying float fade;
varying vec3 color;

float heightMap(sampler2D map, vec2 texCoord, float scale) {
    vec4 pixel = texture2D(map, texCoord);
    float mag = length(pixel.xyz);
    return mag * scale;
}

void main() {
    vec2 texCoord = position / dimensions;
    float height = heightMap(surfaceMap, texCoord, heightScale) + 1.0;
    vec3 pos = vec3(position, height);
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);

    float brightness = 1.0 - clamp(speed, 0.0, 1.0);
    color = mix(color0, color1, brightness);

    float timeDiff = mod(time - currTime, maxTime) / maxTime;
    float headFade = pow(0.1 / timeDiff, 5.0);
    fade = clamp(sign(time) * max(timeDiff, headFade), 0.0, 1.0);
}
