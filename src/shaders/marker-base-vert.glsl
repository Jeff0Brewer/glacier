attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform mat4 baseRotation;
uniform vec3 markerPos;

varying vec3 vNormal;
varying float vZ;

void main() {
    vec3 rotated = (baseRotation * vec4(position, 1.0)).xyz;
    vec3 pos = rotated + markerPos;
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(pos, 1.0);
    vNormal = normal;
    vZ = position.z;
}
