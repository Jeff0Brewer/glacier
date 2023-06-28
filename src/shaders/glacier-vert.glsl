attribute vec2 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform sampler2D surfaceMap;
uniform vec2 dimensions;
uniform float heightScale;

varying vec3 normal;

float heightMap(sampler2D map, vec2 texCoord, float scale) {
    vec4 pixel = texture2D(map, texCoord);
    float mag = length(pixel.xyz);
    return mag * scale;
}

vec3 get3DPos(sampler2D map, vec2 pos, vec2 dims, float scale) {
    vec2 texCoord = pos / dims;
    float height = heightMap(map, texCoord, scale);
    return vec3(pos, height);
}

vec3 getNormal(sampler2D map, vec2 pos, vec2 dims, float scale) {
    float delta = 2.0;
    vec3 px = get3DPos(map, pos + vec2(delta, 0.0), dims, scale);
    vec3 nx = get3DPos(map, pos + vec2(-delta, 0.0), dims, scale);
    vec3 py = get3DPos(map, pos + vec2(0.0, delta), dims, scale);
    vec3 ny = get3DPos(map, pos + vec2(0.0, -delta), dims, scale);
    vec3 xVec = px - nx;
    vec3 yVec = py - ny;
    vec3 norm = cross(xVec, yVec);
    return normalize(norm);
}

void main() {
    normal = getNormal(surfaceMap, position, dimensions, heightScale);
    vec3 pos = get3DPos(surfaceMap, position, dimensions, heightScale);
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
}
