precision highp float;

varying float fade;

void main() {
    vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(0.76, 0.27, 0.6), fade);
    gl_FragColor = vec4(color, 1.0);
}
