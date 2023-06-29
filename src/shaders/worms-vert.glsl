attribute vec3 position;
attribute float segment;
attribute vec2 perp;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform sampler2D surfaceMap;
uniform vec2 dimensions;
uniform float heightScale;
uniform float history;
uniform float currSegment;

varying float fade;
varying vec3 color;

float heightMap(sampler2D map, vec2 texCoord, float scale) {
    vec4 pixel = texture2D(map, texCoord);
    float mag = length(pixel.xyz);
    return mag * scale;
}

void main() {
    fade = 1.0 - ((currSegment - segment) / history);

    vec2 texCoord = position.xy / dimensions;
    float surfaceHeight = heightMap(surfaceMap, texCoord, heightScale);
    float height = surfaceHeight + 30.0 + position.z * 0.4;
    height = max(height, surfaceHeight + 0.1);
    vec3 pos = vec3(position.xy + perp * fade * 2.0, height);
    float brightness = clamp((position.z + 30.0) / 60.0, 0.0, 1.0) * 0.7;
    color = vec3(brightness, brightness, 1.0);
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
}
