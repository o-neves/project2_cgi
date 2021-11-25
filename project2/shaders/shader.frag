precision highp float;

uniform vec3 uColor;

void main() {

    //receber pos e a partir dela decidir cor??

    gl_FragColor = vec4(uColor, 1.0);
}