precision highp float;

varying vec3 vNormal;
varying float vZ;

void main() {
    vec3 light = vec3(0.0, 0.0, 1.0);
    float shade = clamp(dot(light, vNormal), 0.0, 1.0) * 0.5 + 0.5;
    // use z position to create white / black sections on base
    float col = step(2.5, vZ);
    vec3 color = vec3(col, col, col);
    gl_FragColor = vec4(color * shade, 1.0);
}
