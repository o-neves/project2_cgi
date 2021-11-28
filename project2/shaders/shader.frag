precision highp float;

uniform vec3 uColor;

varying vec3 fNormal;

void main() {

    gl_FragColor = vec4(uColor+fNormal*0.1, 1.0);
}