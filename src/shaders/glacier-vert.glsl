attribute vec2 position;
attribute vec2 texCoord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform sampler2D surfaceMap;

varying vec3 normal;

float heightMap(sampler2D map, vec2 coord) {
    float scale = 0.1;
    vec4 pixel = texture2D(map, coord);
    float mag = length(pixel);
    return mag * scale;
}

vec3 get3DPos(sampler2D map, vec2 coord) {
    float height = heightMap(map, coord);
    return vec3(coord, height);
}

vec3 getNormal(sampler2D map, vec2 coord) {
    float delta = 0.002;
    vec3 px = get3DPos(map, coord + vec2(delta, 0.0));
    vec3 nx = get3DPos(map, coord + vec2(-delta, 0.0));
    vec3 py = get3DPos(map, coord + vec2(0.0, delta));
    vec3 ny = get3DPos(map, coord + vec2(0.0, -delta));
    vec3 xVec = px - nx;
    vec3 yVec = py - ny;
    vec3 norm = cross(xVec, yVec);
    return normalize(norm);
}

void main() {
    float height = heightMap(surfaceMap, texCoord);
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(position, height, 1.0);
    normal = getNormal(surfaceMap, texCoord);
}
