precision highp float;

varying float fade;

void main() {
    if (fade == 0.0) {
        discard;
    }
    gl_FragColor = vec4(0.0, 0.0, 1.0, fade);
}
