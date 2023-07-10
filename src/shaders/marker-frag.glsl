precision highp float;

varying vec3 vNormal;
varying vec3 vColor;

void main() {
    vec3 light = vec3(0.0, 0.0, 1.0);
    float shade = clamp(dot(light, vNormal), 0.0, 1.0) * 0.5 + 0.5;
    gl_FragColor = vec4(vColor * shade, 1.0);
}
