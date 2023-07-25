attribute vec3 position;
attribute vec3 normal;
attribute vec3 color;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform vec3 markerPos;
uniform float height;
uniform vec3 accent;

varying vec3 vNormal;
varying vec3 vColor;

void main() {
    vec3 pos = position + markerPos;
    float notBottom = step(0.0001, position.z);
    pos.z += notBottom * height;
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
    vNormal = normal;
    // use color as flag to check if accent color should be used
    if (color.x == 1.0 && color.y == 0.0 && color.z == 1.0) {
        vColor = accent;
    } else {
        vColor = color;
    }
}
