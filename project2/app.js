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
let turretDegre = 0;
let barrelDegre = 15;

const MAX_BARREL_DEGREE = 180;
const MIN_BARREL_DEGREE = 0;
const BARREL_MOV = 5;
const TURRET_MOV = 5;
const PI = 3.14159265359;
const FLOOR_DIAMETER = 1;
const HULL_HEIGHT = 1.5;
const FLOOR_CUBES = 20;
const TANK_MOVE = 0.1;
const TANK_DEPT = HULL_HEIGHT * 2;
const CENTER = FLOOR_CUBES/2;

const FLOOR_HEIGHT = 0.5 * FLOOR_DIAMETER;

const HULL_WIDTH = HULL_HEIGHT * 4;

const TIRE_DIAMETER_SCALE = HULL_HEIGHT/2;
const TIRE_DIAMETER = 1.4 * TIRE_DIAMETER_SCALE;
const TIRE_HEIGHT_FLOOR = FLOOR_HEIGHT/2 + TIRE_DIAMETER/2 ;
const TIRE_DEPT = TANK_DEPT/2;
const NUMBER_OF_TIRES = 5;

const RIM_DEPT_SCALE = TIRE_DEPT/2;

const HULL_HEIGHT_FLOOR = TIRE_HEIGHT_FLOOR + HULL_HEIGHT/2;

const TURRET_WIDHT = HULL_WIDTH/2;
const TURRET_HEIGHT = HULL_HEIGHT*1.1;
const TURRET_DEPT = TANK_DEPT/1.5;
const TURRET_HEIGHT_FLOOR = HULL_HEIGHT_FLOOR + HULL_HEIGHT/2;

const BARREL_WIDHT = TURRET_WIDHT;
const BARREL_HEIGHT = TURRET_HEIGHT/6.5; 
const BARREL_DEPT = TURRET_DEPT/6; 
const BARREL_WIDHT_FLOOR = CENTER+TURRET_WIDHT/2;
const BARREL_HEIGHT_FLOOR = HULL_HEIGHT_FLOOR + HULL_HEIGHT/1.1; 

const TURRET_BASE_WIDHT = TURRET_WIDHT*1.1;
const TURRET_BASE_HEIGHT = TURRET_HEIGHT*0.1;
const TURRET_BASE_DEPT= TURRET_DEPT*1.1;
const TURRET_BASE_HEIGHT_FLOOR = TURRET_HEIGHT_FLOOR + TURRET_BASE_HEIGHT/2;


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
                if(MAX_BARREL_DEGREE > barrelDegre+BARREL_MOV)
                barrelDegre += BARREL_MOV;
                else barrelDegre = 180;
            break;
            case 's':
                if(MIN_BARREL_DEGREE < barrelDegre-BARREL_MOV)
                barrelDegre -= BARREL_MOV;
                else barrelDegre = 0;
            break;
            case 'a':
                turretDegre += TURRET_MOV; 
            break;
            case 'd':
                turretDegre -= TURRET_MOV; 
            break;
            case 'SPACE':
                //Dispara um projetil, devendo o mesmo sair pela extremidade do cano, na direção por este apontada
            break;
            case 'ArrowUp':
                if(mov <= ((CENTER) - (NUMBER_OF_TIRES/2 * TIRE_DIAMETER)) ){
                    mov += TANK_MOVE;
                    rot += (1 * (TANK_MOVE / 1) * (180 / PI));
                }
            break;
            case 'ArrowDown':
                if(mov >= -((CENTER) - (NUMBER_OF_TIRES/2 * TIRE_DIAMETER)) ){
                    mov -= TANK_MOVE;
                    rot += (-1 * (TANK_MOVE / 1) * (180 / PI));
                }
            break;
            case '1':
                //vista de frente
                mView = lookAt(vec3(-CENTER,0,CENTER),vec3(CENTER,0,CENTER),vec3(0,1,0));
              
               break;
            case '2':
                //vista de cima
                mView = lookAt(vec3(CENTER,10,CENTER),vec3(CENTER,0,CENTER),vec3(1,0,0));
              
            break;
            case '3':
                //vista de lado
                mView = lookAt(vec3(CENTER,0,0),vec3(CENTER,0,CENTER),vec3(0,1,0));
            break;
            case '4':
                //projecao axonometrica
                mView = lookAt(vec3(FLOOR_CUBES,4,FLOOR_CUBES),vec3(CENTER,0,CENTER),vec3(0,1,0));
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
            multTranslation([CENTER ,TURRET_BASE_HEIGHT_FLOOR, CENTER]);
            multRotationY(turretDegre);
            turretAndBarrel();
        popMatrix();
        pushMatrix();
            axleSet();
        popMatrix();
       
    }

    function turretAndBarrel(){
        pushMatrix();
            turret();
        popMatrix();
        multTranslation([0,BARREL_HEIGHT,0]);
        pushMatrix();
            multRotationZ([barrelDegre]);
            multTranslation([BARREL_WIDHT/2,0,0]);
            barrel();
        popMatrix();
        
    }


    function turretPopOut(){
        multScale([TURRET_WIDHT, TURRET_HEIGHT, TURRET_DEPT]);

        uploadColor(vec3(0.498,0.443,0.588));
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function turret(){
       
        pushMatrix();
            turretBase();
        popMatrix();
        pushMatrix();
            turretPopOut();
        popMatrix();
    }

    function turretBase(){
        multScale([TURRET_BASE_WIDHT , TURRET_BASE_HEIGHT, TURRET_BASE_DEPT]);

        uploadColor(vec3(0.655,0.608,0.741));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }

    function barrel(){
        multScale([BARREL_WIDHT, BARREL_HEIGHT, BARREL_DEPT]);
        multRotationZ([90]);
        

        uploadColor(vec3(0.655,0.608,0.741));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }


    
    function hull(){
        pushMatrix();
            bottomHull();
        popMatrix();
        pushMatrix();
            spearHull();
        popMatrix();
    }

    function spearHull(){
        pushMatrix();
            multTranslation([CENTER + HULL_WIDTH/2,HULL_HEIGHT_FLOOR,CENTER]);
            spear();
        popMatrix();
        pushMatrix();
        multTranslation([CENTER - HULL_WIDTH/2,HULL_HEIGHT_FLOOR,CENTER]);
            spear();
        popMatrix();
    }

    function spear(){
        multScale([1, HULL_HEIGHT,  Math.sqrt(Math.pow(TANK_DEPT,2)/2) ]);
        multRotationY([45]);

        uploadColor(vec3(0.361,0.294,0.451));
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function bottomHull(){
        multTranslation([CENTER,HULL_HEIGHT_FLOOR,CENTER]);
        multScale([HULL_WIDTH, HULL_HEIGHT, TANK_DEPT]);
        multRotationZ(180);

        uploadColor(vec3(0.361,0.294,0.451));
        uploadModelView();
        CUBE.draw(gl, program, mode);
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

        uploadColor(vec3(0.78,0.761,0.929));
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
        multRotationZ(rot);

        uploadColor(vec3(1,1,1));
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    } 



    function render(){
    
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));


        loadMatrix(mView);

        //meter constante e maybe mandar já tudo para o meio
        multTranslation([0.5,0,0.5]);
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
            if(FLOOR_CUBES % 2 == 0) multTranslation([ (-FLOOR_DIAMETER/2) + mov, 0, 0]);
            else multTranslation([0 + mov, 0, 0]);
            tank();
        popMatrix();
     
    
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))