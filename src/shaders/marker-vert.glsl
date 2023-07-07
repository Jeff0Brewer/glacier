attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform vec3 markerPos;
uniform float height;

void main() {
    vec3 pos = position + markerPos;
    // use step to avoid branch, check if vertex is bottom of pin (z = 0)
    float notBottom = step(0.0001, abs(position.z));
    pos.z += notBottom * (position.z + height);
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
}
