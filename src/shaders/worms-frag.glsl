precision highp float;

varying float fade;
varying vec3 color;

void main() {
    gl_FragColor = vec4(color, fade);
}
