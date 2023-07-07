attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform vec3 markerPos;
uniform float height;

void main() {
    vec3 pos = position + markerPos;
    float notBottom = step(0.0001, position.z);
    pos.z += notBottom * height;
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
}
