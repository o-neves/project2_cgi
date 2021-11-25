import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../../libs/utils.js";
import { ortho, lookAt, flatten, vec3 } from "../../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multRotationX, multScale, multTranslation, popMatrix, pushMatrix, multRotationZ} from "../../../libs/stack.js";

import * as SPHERE from '../../../libs/sphere.js';
import * as CUBE from '../../../libs/cube.js';
import * as TORUS from '../../../libs/torus.js';

/** @type WebGLRenderingContext */
let gl;

//let time = 0;           // Global simulation time in days
//let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let mProjection;
let mView;
let vecMView = [];

const FLOOR_SCALE = 0.5;
const FLOOR_CUBES = 20;




function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);


    mView = lookAt(vec3(FLOOR_CUBES/2,0,0),vec3(FLOOR_CUBES/2,0,FLOOR_CUBES/2),vec3(0,1,0));
    mode = gl.LINES;


    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case 'W':
                mode = gl.LINES; 
                break;
            case 'S':
                mode = gl.TRIANGLES;
                break;
            case 'w':
                //subir cano do tanque
            break;
            case 's':
                //descer cano do tanque
            break;
            case 'a':
                //rodar cano para a esquerda
            break;
            case 'd':
                //rodar cano para a direita
            break;
            case 'SPACE':
                //Dispara um projetil, devendo o mesmo sair pela extremidade do cano, na direção por este apontada
            break;
            case 'UP ARROW':
                //avancar tanque
            break;
            case 'DOWN ARROW':
                //recuar tanque1
            break;
            case '1':
                //vista de frente
                mView = lookAt(vec3(-FLOOR_CUBES/2,0,FLOOR_CUBES/2),vec3(FLOOR_CUBES/2,0,FLOOR_CUBES/2),vec3(0,1,0));
              
               break;
            case '2':
                //vista de cima
                mView = lookAt(vec3(FLOOR_CUBES/2,10,FLOOR_CUBES/2),vec3(FLOOR_CUBES/2,0,FLOOR_CUBES/2),vec3(1,0,0));
              
            break;
            case '3':
                //vista de lado
                mView = lookAt(vec3(FLOOR_CUBES/2,0,0),vec3(FLOOR_CUBES/2,0,FLOOR_CUBES/2),vec3(0,1,0));
            break;
            case '4':
                //projecao axonometrica
            break;
            case '+':
                //zoom in
                break;
            case '-':
                //zoom out
                break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    CUBE.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);

        mProjection = ortho(-FLOOR_CUBES/2*aspect,FLOOR_CUBES/2*aspect, -FLOOR_CUBES/2, FLOOR_CUBES/2,-3*FLOOR_CUBES/2,3*FLOOR_CUBES/2);
   
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function uploadColor(color){
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), color);
    }


    function tiles(){

        // Send the current modelview matrix to the vertex shader
        uploadColor(vec3(1,0,1));
        uploadModelView();
        CUBE.draw(gl, program, mode);

    }

    function floor()
    {

        for(let i = 0; i < FLOOR_CUBES;i++){
            for(let j = 0; j < FLOOR_CUBES;j++){
                pushMatrix();
                    multTranslation([i,0,j]);
                    multScale([1, FLOOR_SCALE, 1]);
                    tiles();
                popMatrix();
            }
        }
       
    }

    function tank(){

        pushMatrix();
        hull();
        popMatrix();
        pushMatrix();
        wheels();
        popMatrix();

       
  
    }

    function wheels(){

      pushMatrix();
        oneSideWheels();
      popMatrix(); 
      pushMatrix();
        multTranslation([0, 0, 2 ]);
        oneSideWheels();
      popMatrix();
  
    
    }

    function oneSideWheels(){
        pushMatrix();
        tire();
        popMatrix();
        pushMatrix();
        multTranslation([1.4,0,0]);
        tire();
        popMatrix();
        pushMatrix();
        multTranslation([-1.4,0,0]);
        tire();
        popMatrix();
        pushMatrix();
        multTranslation([2.8,0,0]);
        tire();
        popMatrix();
        pushMatrix();
        multTranslation([-2.8,0,0]);
        tire();
        popMatrix();
    }

    function tire(){
        multTranslation([FLOOR_CUBES/2,0.8,FLOOR_CUBES/2 - 1]);
        multRotationZ(90);
        multRotationX(90);

        
        uploadColor(vec3(1,1,0));
        uploadModelView();
        TORUS.draw(gl, program, mode);
    }

    function hull(){
        multTranslation([FLOOR_CUBES/2,1.5,FLOOR_CUBES/2]);
        multScale([8, 1, 2]);

        uploadColor(vec3(1,0,0));
        uploadModelView();
        CUBE.draw(gl, program, mode);
     
    }

    function upa(){

    }


    function render()
    {
    
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));


        loadMatrix(mView);
        
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
            tank();
        popMatrix();
     
    
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))