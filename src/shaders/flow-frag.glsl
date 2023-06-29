precision highp float;

varying float fade;
varying vec3 color;

void main() {
    if (fade <= 0.0) {
        discard;
    }
    gl_FragColor = vec4(color, fade);
}
