attribute vec2 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform sampler2D surfaceMap;
uniform vec2 dimensions;

varying vec3 normal;

float heightMap(sampler2D map, vec2 texCoord) {
    float scale = 100.0;
    vec4 pixel = texture2D(map, texCoord);
    float mag = length(pixel.xyz);
    return mag * scale;
}

vec3 get3DPos(sampler2D map, vec2 pos, vec2 dims) {
    vec2 texCoord = pos / dims;
    float height = heightMap(map, texCoord);
    return vec3(pos, height);
}

vec3 getNormal(sampler2D map, vec2 pos, vec2 dims) {
    float delta = 2.0;
    vec3 px = get3DPos(map, pos + vec2(delta, 0.0), dims);
    vec3 nx = get3DPos(map, pos + vec2(-delta, 0.0), dims);
    vec3 py = get3DPos(map, pos + vec2(0.0, delta), dims);
    vec3 ny = get3DPos(map, pos + vec2(0.0, -delta), dims);
    vec3 xVec = px - nx;
    vec3 yVec = py - ny;
    vec3 norm = cross(xVec, yVec);
    return normalize(norm);
}

void main() {
    normal = getNormal(surfaceMap, position, dimensions);
    vec3 pos = get3DPos(surfaceMap, position, dimensions);
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
}
