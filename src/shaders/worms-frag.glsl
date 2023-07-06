precision highp float;

varying float fade;

void main() {
    vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(0.3, 0.3, 1.0), fade);
    gl_FragColor = vec4(color, 1.0);
}
