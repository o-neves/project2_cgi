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
let mov = 0.0;
let rot = 0;
let zoom = 10;


const PI = 3.14159265359;
const FLOOR_DIAMETER = 1;
const HULL_HEIGHT = 2;
const FLOOR_CUBES = 20;
const TANK_MOVE = 0.1;
const TANK_DEPT = 3;
const CENTER = FLOOR_CUBES/2;

const FLOOR_HEIGHT = 0.5 * FLOOR_DIAMETER;

const HULL_WIDTH = HULL_HEIGHT * 3.5;

const TIRE_DIAMETER_SCALE = HULL_HEIGHT/2.2;
const TIRE_DIAMETER = 1.4 * TIRE_DIAMETER_SCALE;
const TIRE_HEIGHT_FLOOR = FLOOR_HEIGHT/2 + TIRE_DIAMETER/2 ;
const TIRE_DEPT = TANK_DEPT/1.5;

const RIM_DEPT_SCALE = TIRE_DEPT/2;

const HULL_HEIGHT_FLOOR = TIRE_HEIGHT_FLOOR + HULL_HEIGHT/2;

const TURRET_WIDHT = HULL_WIDTH/2;
const TURRET_HEIGHT = HULL_HEIGHT;
const TURRET_DEPT = TANK_DEPT/1.5;
const TURRET_HEIGHT_FLOOR = HULL_HEIGHT_FLOOR + HULL_HEIGHT/2;

const BARREL_WIDHT = TURRET_WIDHT;
const BARREL_HEIGHT = TURRET_HEIGHT/6.5; 
const BARREL_DEPT = TURRET_DEPT/4; 
const BARREL_WIDHT_FLOOR = CENTER+TURRET_WIDHT/2;
const BARREL_HEIGHT_FLOOR = HULL_HEIGHT_FLOOR + HULL_HEIGHT/1.1; 

function setup(shaders){
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
                if(mov <= (FLOOR_CUBES/2 - 4) ){
                    mov += TANK_MOVE;
                    rot += (1 * (TANK_MOVE / 1) * (180 / PI));
                }
            break;
            case 'ArrowDown':
                if(mov >= -(FLOOR_CUBES/2 - 3) ){
                    mov -= TANK_MOVE;
                    rot += (-1 * (TANK_MOVE / 1) * (180 / PI));
                }
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
                mView = lookAt(vec3(FLOOR_CUBES,4,FLOOR_CUBES),vec3(FLOOR_CUBES/2,0,FLOOR_CUBES/2),vec3(0,1,0));
            break;
            case '+':
                if (zoom > 6){
                    zoom -= 1;
                    //ortho(left, right, bottom, top, near, far)
                    mProjection = ortho (-zoom*aspect, zoom*aspect, -zoom, zoom, -3*zoom, 3*zoom);
                }
                break;
            case '-':
                zoom += 1;
                mProjection = ortho (-zoom*aspect, zoom*aspect, -zoom, zoom, -3*zoom, 3*zoom);
                break;
        }
    }

    gl.clearColor(0.573,0.573,0.573, 1.0);
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

        mProjection = ortho (-zoom*aspect, zoom*aspect, -zoom, zoom, -3*zoom, 3*zoom);
   
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
                    multScale([1, FLOOR_HEIGHT, 1]);
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
            multTranslation([BARREL_WIDHT_FLOOR,BARREL_HEIGHT_FLOOR,CENTER]);
            multRotationZ([15]);
            barrel();
        popMatrix();
        pushMatrix();
            axleSet();
        popMatrix();
       
    }


    function axleSet(){
        pushMatrix();
            wheelsAndAxle();
        popMatrix();

        pushMatrix();
        multTranslation([TIRE_DIAMETER,0,0]);
        wheelsAndAxle();
        popMatrix();

        pushMatrix();
        multTranslation([-TIRE_DIAMETER,0,0]);
        wheelsAndAxle();
        popMatrix();

        pushMatrix();
        multTranslation([2*-TIRE_DIAMETER,0,0]);
        wheelsAndAxle();
        popMatrix();

        pushMatrix();
        multTranslation([2*TIRE_DIAMETER,0,0]);
        wheelsAndAxle();
        popMatrix();
    }

    function wheelsAndAxle(){
        pushMatrix();
            axle();
        popMatrix(); 
        pushMatrix();
            pairWheels();
        popMatrix();

    }


    function axle(){
        multTranslation([CENTER , TIRE_HEIGHT_FLOOR ,CENTER]);
        multScale([TIRE_DIAMETER/6, TIRE_DIAMETER/6, TANK_DEPT]);
        multRotationX(90);

        uploadColor(vec3(0,0,0.88));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }


    function turret(){
        multTranslation([CENTER ,TURRET_HEIGHT_FLOOR,CENTER]);
        multScale([TURRET_WIDHT, TURRET_HEIGHT, TURRET_DEPT]);

        uploadColor(vec3(0.808,0.616,0.851));
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        

    }

    function barrel(){
        multScale([BARREL_WIDHT, BARREL_HEIGHT, BARREL_DEPT]);
        multRotationZ([90]);
        

        uploadColor(vec3(1,0.616,0.851));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }

    function pairWheels(){

        multTranslation([CENTER,TIRE_HEIGHT_FLOOR ,CENTER - TANK_DEPT/2]);
        pushMatrix();
            tire();
        popMatrix();
        pushMatrix();
            rim();
        popMatrix();
        multTranslation([0, 0, TANK_DEPT]);
        pushMatrix();
           tire();
        popMatrix();
        pushMatrix();
            rim();
        popMatrix();
  
    }


    function tire(){
        
        multScale([TIRE_DIAMETER_SCALE,TIRE_DIAMETER_SCALE,TIRE_DEPT]);
        multRotationZ(rot);
        multRotationX(90);
        
        uploadColor(vec3(0.584,0.49,0.678));
        uploadModelView();
        TORUS.draw(gl, program, mode);
    }

    function rim(){  

        multScale([TIRE_DIAMETER_SCALE,TIRE_DIAMETER_SCALE,RIM_DEPT_SCALE]);

        uploadColor(vec3(1,1,1));
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    } 


    function hull(){
            pushMatrix();
                bottomHull();
            popMatrix();
            /*pushMatrix();
                spearHull();
            popMatrix();*/
    }

    function bottomHull(){
        multTranslation([CENTER,HULL_HEIGHT_FLOOR,CENTER]);
        multScale([HULL_WIDTH, HULL_HEIGHT, TANK_DEPT]);
        multRotationZ(180);

        uploadColor(vec3(0.467,0.62,0.796));
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function spearHull(){

     /*   pushMatrix();
            multTranslation([FLOOR_CUBES/2-4,HULL_HEIGHT_FLOOR,FLOOR_CUBES/2]);
            multScale([1, HULL_HEIGHT, 2]);
            multRotationZ(90);
            spear();
        popMatrix();
        pushMatrix();
            multTranslation([FLOOR_CUBES/2+4,HULL_HEIGHT_FLOOR,FLOOR_CUBES/2]);
            multScale([1, HULL_HEIGHT, 2]);
            multRotationZ(-90);
            spear();
        popMatrix();
    */
    }

    function spear(){
       //multRotationX([]);

        uploadColor(vec3(0.467,0.62,0.796));
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }


    function render(){
    
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));


        loadMatrix(mView);

        multTranslation([0.5,0,0.5]);
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