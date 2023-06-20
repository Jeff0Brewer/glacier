attribute vec2 position;
attribute vec2 texCoord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

uniform sampler2D surfaceMap;

varying vec4 testColor;

void main() {
    float height = length(texture2D(surfaceMap, texCoord)) * .1;
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(position, height, 1.0);
    float col = height*height * 10.0;
    testColor = vec4(col, col, col, 1.0);
}
