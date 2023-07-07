precision highp float;

uniform vec3 color;

varying vec3 vNormal;

void main() {
    vec3 light = vec3(0.0, 0.0, 1.0);
    float shade = clamp(dot(light, vNormal), 0.0, 1.0) * 0.5 + 0.5;
    gl_FragColor = vec4(color * shade, 1.0);
}
