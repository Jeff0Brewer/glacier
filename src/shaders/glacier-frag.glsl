precision highp float;

varying vec3 vNormal;

void main() {
    vec3 camera = vec3(0.0, 0.0, 1.0);
    float shade = dot(vNormal, camera);
    gl_FragColor = vec4(vec3(0.9, 0.9, 1.0) * shade, 1.0);
}
