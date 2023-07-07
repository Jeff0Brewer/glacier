precision highp float;

uniform sampler2D texture;

varying vec3 vNormal;
varying vec2 vTexCoord;

void main() {
    vec3 light = vec3(0.0, 0.0, 1.0);
    float shade = dot(vNormal, light);
    vec4 color = texture2D(texture, vTexCoord);
    gl_FragColor = vec4(color.xyz * shade, 1.0);
}
