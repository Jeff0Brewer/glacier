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

float heightMap(sampler2D map, vec2 texCoord, float scale) {
    vec4 pixel = texture2D(map, texCoord);
    float mag = length(pixel.xyz);
    return mag * scale;
}

void main() {
    fade = 1.0 - ((currSegment - segment) / history);
    vec2 texCoord = position.xy / dimensions;
    float height = heightMap(surfaceMap, texCoord, heightScale) + 2.0;
    vec3 pos = vec3(position.xy + perp * fade * 1.0, height);
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
}
