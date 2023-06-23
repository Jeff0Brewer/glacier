precision highp float;

varying vec3 normal;

void main() {
    vec3 color = vec3(0.9, 0.9, 1.0);
    vec3 camera = vec3(0.0, 0.0, 1.0);
    float shadeIntensity = 0.5;
    float shade = dot(normal, camera) * shadeIntensity + (1.0 - shadeIntensity);
    gl_FragColor = vec4(color * shade, 1.0);
}
