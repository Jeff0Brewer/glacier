attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;

void main() {
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(position, 1.0);
}
