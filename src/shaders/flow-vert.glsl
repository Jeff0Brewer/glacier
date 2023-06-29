attribute vec3 position;
attribute float ind;
attribute float speed;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform sampler2D surfaceMap;
uniform vec2 dimensions;
uniform float heightScale;
uniform float maxInd;
uniform float currInd;

varying float fade;
varying vec3 color;

float heightMap(sampler2D map, vec2 texCoord, float scale) {
    vec4 pixel = texture2D(map, texCoord);
    float mag = length(pixel.xyz);
    return mag * scale;
}

void main() {
    vec2 texCoord = position.xy / dimensions;
    float height = heightMap(surfaceMap, texCoord, heightScale) + 1.0;
    vec3 pos = vec3(position.xy, height);
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);

    float brightness = (1.0 - pow(speed, 0.25));
    color = vec3(brightness, brightness, 1.0);
    fade = sign(ind) * mod((ind - currInd), maxInd) / maxInd;
}
