precision highp float;

void main() {
    vec2 centerXY = 2.0 * gl_PointCoord - 1.0;
    float radius = dot(centerXY, centerXY);
    if (radius > 1.0) {
        discard;
    }
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
