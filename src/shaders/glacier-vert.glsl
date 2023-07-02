attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;

varying vec3 normal;

void main() {
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(position, 1.0);
    normal = vec3(0.0, 0.0, 1.0);
}
