import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../../libs/utils.js";
import { ortho, lookAt, flatten, vec3 } from "../../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multRotationX, multScale, multTranslation, popMatrix, pushMatrix, multRotationZ} from "../../../libs/stack.js";

import * as SPHERE from '../../../libs/sphere.js';
import * as CUBE from '../../../libs/cube.js';
import * as TORUS from '../../../libs/torus.js';
import * as PYRAMID from '../../../libs/pyramid.js';
import * as CYLINDER from '../../../libs/cylinder.js';

/** @type WebGLRenderingContext */
let gl;

//let time = 0;           // Global simulation time in days
//let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let mProjection;
let mView;
let mov = 0;

const FLOOR_SCALE = 0.5;
const FLOOR_CUBES = 20;
const HULL_HIGHT = 1;
const HULL_HIGHT_FLOOR = 1.5;


function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);


    mView = lookAt(vec3(FLOOR_CUBES/2,0,0),vec3(FLOOR_CUBES/2,0,FLOOR_CUBES/2),vec3(0,1,0));
    mode = gl.TRIANGLES;


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
            case 'ArrowUp':
                mov += 1;
            break;
            case 'ArrowDown':
                mov -= 1;
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
    PYRAMID.init(gl);
    CYLINDER.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    function resize_canvas(event){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);

        mProjection = ortho(-FLOOR_CUBES/2*aspect,FLOOR_CUBES/2*aspect, -FLOOR_CUBES/2, FLOOR_CUBES/2,-3*FLOOR_CUBES/2,3*FLOOR_CUBES/2);
   
    }

    function uploadModelView(){
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function uploadColor(color){
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), color);
    }


    function tiles(x,z){

        if((z%2 == 0 && x%2 != 0) || (x%2 == 0 && z%2 != 0)){
            uploadColor(vec3(0.91,0.863,0.792));
        }
        else{
            uploadColor(vec3(0.718,0.741,0.792));
        }
        uploadModelView();
        CUBE.draw(gl, program, mode);

    }

    function floor(){

        for(let i = 0; i < FLOOR_CUBES;i++){
            for(let j = 0; j < FLOOR_CUBES;j++){
                pushMatrix();
                    multTranslation([i,0,j]);
                    multScale([1, FLOOR_SCALE, 1]);
                    tiles(i,j);
                popMatrix();
            }
        }
       
    }

    function tank(){

        pushMatrix();
            hull();
        popMatrix();
        pushMatrix();
            turret();
        popMatrix();
        pushMatrix();
        barrel();
        popMatrix();
        pushMatrix();
            wheels();
        popMatrix();
       

       
  
    }

    function turret(){
        multTranslation([FLOOR_CUBES/2 ,HULL_HIGHT_FLOOR+1,FLOOR_CUBES/2]);
        multScale([1.7, 1.7, 1.7]);

        uploadColor(vec3(0.808,0.616,0.851));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);

    }

    function barrel(){
        multTranslation([FLOOR_CUBES/2+1.,HULL_HIGHT_FLOOR+1.5,FLOOR_CUBES/2]);
        multScale([1.5, 0.2, 0.3]);

        uploadColor(vec3(0.808,0.616,0.851));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);3
    }

    function wheels(){

      pushMatrix();
        multTranslation([0, 0, 0 ]);
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

        
        uploadColor(vec3(0.584,0.49,0.678));
        uploadModelView();
        TORUS.draw(gl, program, mode);
    }

    function hull(){
            pushMatrix();
                bottomHull();
            popMatrix();
            pushMatrix();
                spearHull();
            popMatrix();
            pushMatrix();
                topHull();
            popMatrix();
    }

    function topHull(){
        multTranslation([FLOOR_CUBES/2,HULL_HIGHT_FLOOR + 0.5,FLOOR_CUBES/2]);
        multScale([6, HULL_HIGHT/2, 2]);
        multRotationZ(180);

        uploadColor(vec3(0.255,0.298,0.4));
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }


    function bottomHull(){
        multTranslation([FLOOR_CUBES/2,HULL_HIGHT_FLOOR,FLOOR_CUBES/2]);
        multScale([7, HULL_HIGHT, 2]);
        multRotationZ(180);

        uploadColor(vec3(0.467,0.62,0.796));
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }




    function spearHull(){

        pushMatrix();
            multTranslation([FLOOR_CUBES/2-4,HULL_HIGHT_FLOOR,FLOOR_CUBES/2]);
            multScale([1, HULL_HIGHT, 2]);
            multRotationZ(90);
            spear();
        popMatrix();
        pushMatrix();
            multTranslation([FLOOR_CUBES/2+4,HULL_HIGHT_FLOOR,FLOOR_CUBES/2]);
            multScale([1, HULL_HIGHT, 2]);
            multRotationZ(-90);
            spear();
        popMatrix();

    }

    function spear(){
       
        uploadColor(vec3(0.467,0.62,0.796));
        uploadModelView();
        PYRAMID.draw(gl, program, mode);
    }


    function render(){
    
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));


        loadMatrix(mView);
        
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
            multTranslation([0 + mov,0,0]);
            tank();
        popMatrix();
     
    
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))