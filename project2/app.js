import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../../libs/utils.js";
import { ortho, lookAt, flatten, vec3, mult,add, scale} from "../../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multRotationX, multScale, multTranslation, popMatrix, pushMatrix, multRotationZ} from "../../../libs/stack.js";

import * as SPHERE from '../../../libs/sphere.js';
import * as CUBE from '../../../libs/cube.js';
import * as TORUS from '../../../libs/torus.js';
import * as PYRAMID from '../../../libs/pyramid.js';
import * as CYLINDER from '../../../libs/cylinder.js';
import { inverse, mat4, normalMatrix, vec4 } from "../libs/MV.js";

/** @type WebGLRenderingContext */
let gl;



let mode;    
let mProjection;
let mView;
let mov = 0.0;
let rot = 0;
let zoom = 10;
let turretDegre = 0;
let barrelDegre = 15;
let lastMV = mat4();
let time = 0;
let fired = false;
let center_of_the_tank = 0;

const FRAME_RATE = 1/60;

const ZOOM = 10;
const ZOOM_CHANGE = 0.1;


const MAX_BARREL_DEGREE = 180;
const MIN_BARREL_DEGREE = 0;
const BARREL_MOV = 5;
const TURRET_MOV = 5;
const PI = 3.14159265359;
const FLOOR_DIAMETER = 1;
const HULL_HEIGHT = 1.5;
const FLOOR_CUBES = 20;
const WHEELS_PER_SIDE = 5;
const TANK_MOVE = 0.1;
const TANK_DEPT = HULL_HEIGHT * 2;
const CENTER = FLOOR_CUBES/2;

const FLOOR_HEIGHT = 0.5 * FLOOR_DIAMETER;

const HULL_WIDTH = HULL_HEIGHT * 4;

const SPEAR_WIDTH = Math.sqrt(Math.pow(TANK_DEPT,2)/2);

const TIRE_DIAMETER_SCALE = HULL_HEIGHT*0.5;
const TIRE_DIAMETER = 1.4 * TIRE_DIAMETER_SCALE;
//sera que uso
const TIRE_HEIGHT_FLOOR =  TIRE_DIAMETER/2 ;

const TIRE_DEPT = TANK_DEPT/2;
const NUMBER_OF_TIRES = 5;

const RIM_DEPT_SCALE = TIRE_DEPT/2;

const HULL_HEIGHT_FLOOR = TIRE_HEIGHT_FLOOR + HULL_HEIGHT/2;
const CENTER_ZOOM = HULL_HEIGHT_FLOOR / (ZOOM/0.1);

const TURRET_WIDHT = HULL_WIDTH/2;
const TURRET_HEIGHT = HULL_HEIGHT*1.1;
const TURRET_DEPT = TANK_DEPT/1.5;
const TURRET_HEIGHT_FLOOR = HULL_HEIGHT_FLOOR + HULL_HEIGHT/2;

const BARREL_WIDHT = TURRET_WIDHT;
const BARREL_HEIGHT = TURRET_HEIGHT/6.5; 
const BARREL_DEPT = TURRET_DEPT/6; 


const TURRET_BASE_WIDHT = TURRET_WIDHT*1.1;
const TURRET_BASE_HEIGHT = TURRET_HEIGHT*0.1;
const TURRET_BASE_DEPT= TURRET_DEPT*1.1;
const TURRET_BASE_HEIGHT_FLOOR = TURRET_HEIGHT_FLOOR + TURRET_BASE_HEIGHT/2;

//ver se dá para melhorar
const MIDDLE_AXEL_WIDTH = (WHEELS_PER_SIDE * TIRE_DIAMETER)/(TANK_DEPT*1.2);


function setup(shaders){
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);


    mView = lookAt(vec3(CENTER,0,0),vec3(CENTER,0,CENTER),vec3(0,1,0));
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
            case ' ':
                //Dispara um projetil, devendo o mesmo sair pela extremidade do cano, na direção por este apontada
                fired = true;
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
                //Parar no 0.1 ou 0?
                if (zoom - ZOOM_CHANGE > 0.1){
                    zoom -= ZOOM_CHANGE;
                if(center_of_the_tank < HULL_HEIGHT_FLOOR) center_of_the_tank += CENTER_ZOOM;
                //ortho(left, right, bottom, top, near, far)
                mProjection = ortho (-zoom*aspect, zoom*aspect, -zoom + center_of_the_tank, zoom + center_of_the_tank, -3*ZOOM, 3*ZOOM);
                }
            break;
            case '-':
                
                              
                zoom += 0.1;
                if(center_of_the_tank > CENTER_ZOOM) center_of_the_tank -= CENTER_ZOOM;
                mProjection = ortho (-zoom*aspect, zoom*aspect, -zoom + center_of_the_tank, zoom + center_of_the_tank, -3*ZOOM, 3*ZOOM);
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

        //mProjection = ortho (-zoom*aspect, zoom*aspect, -zoom + HULL_HEIGHT_FLOOR, zoom + HULL_HEIGHT_FLOOR, -3*ZOOM, 3*ZOOM);
        mProjection = ortho (-zoom*aspect, zoom*aspect, -zoom, zoom, -3*ZOOM, 3*ZOOM);
   
    }

    function uploadModelView(){
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function uploadColor(color){
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), color);
    }


    //tiles
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

    //floor
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

    //tank
    function tank(){

        pushMatrix();
            hull();
        popMatrix();
        
        pushMatrix()
            multTranslation([0 ,TURRET_BASE_HEIGHT_FLOOR, 0]);
            multRotationY(turretDegre);
            turretAndBarrel();
        popMatrix();
        
        pushMatrix();
            wheelsAndAxis();
        popMatrix();
       
    }

    //Barrel e Turret juntos
    function turretAndBarrel(){
        pushMatrix();
            turret();
        popMatrix();
        
        //adicionar constante
        multTranslation([0 ,TURRET_BASE_HEIGHT*1.5,0]);
        pushMatrix();
            multRotationZ(barrelDegre);
            multTranslation([BARREL_WIDHT/2 ,0,0]);
            barrel();
        popMatrix();
        
        
    }

    //turret
    function turret(){
        
        pushMatrix();
            turretBase();
        popMatrix();

        pushMatrix();
            turretPopOut();
        popMatrix();
    }

    //turret pop out
    function turretPopOut(){
        multScale([TURRET_WIDHT, TURRET_HEIGHT, TURRET_DEPT]);

        uploadColor(vec3(0.498,0.443,0.588));
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    //turret base
    function turretBase(){
        multScale([TURRET_BASE_WIDHT , TURRET_BASE_HEIGHT, TURRET_BASE_DEPT]);

        uploadColor(vec3(0.655,0.608,0.741));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }

    
    function barrel(){
        multRotationZ(90);
        pushMatrix();
            barrelPipe();
        popMatrix();
        pushMatrix();
            barrelTip();
        popMatrix();

        
    }

    function barrelPipe(){

        multScale([BARREL_HEIGHT,BARREL_WIDHT,BARREL_DEPT]);

        uploadColor(vec3(0.655,0.608,0.741));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);

    }


    //ver
    function barrelTip(){
        //criar constantes  

        multTranslation([0, -BARREL_WIDHT/2 , 0]); 
        multScale([BARREL_HEIGHT*1.4, BARREL_WIDHT/5, BARREL_DEPT*1.1]);

        lastMV = modelView();

        uploadColor(vec3(0.498,0.443,0.588));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);

    }

    //hull
    function hull(){
        multTranslation([0,HULL_HEIGHT_FLOOR,0]);
        pushMatrix();
            baseHull();
        popMatrix();
       
        pushMatrix();
            spearHull();
        popMatrix();
        
    }

    //edges of the hull
    function spearHull(){
        //adicionar constante
        pushMatrix();
            multTranslation([HULL_WIDTH/2,0,0]);
            spear();
        popMatrix();
        pushMatrix();
            multTranslation([-HULL_WIDTH/2,0,0]);
            spear();
        popMatrix();
    }

    //spear
    function spear(){
        multRotationY(45);
        //minor offset because of shadow
        multScale([SPEAR_WIDTH, HULL_HEIGHT - 0.001, SPEAR_WIDTH]);

        uploadColor(vec3(0.361,0.294,0.451));
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    //Hull base
    function baseHull(){
        multRotationZ(180);
        multScale([HULL_WIDTH, HULL_HEIGHT, TANK_DEPT]);

        uploadColor(vec3(0.361,0.294,0.451));
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }



    //wheels and axis together
    function wheelsAndAxis(){
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

        pushMatrix();
            multRotationY(90);
            multScale([1, 1, MIDDLE_AXEL_WIDTH]);
            axle();
        popMatrix();
        
    }

    //pair of wheels and axle in between
    function wheelsAndAxle(){
       pushMatrix();
            axle();
        popMatrix();

        pushMatrix();
            pairWheels();
        popMatrix();

    }


    //axle
    function axle(){
        multTranslation([0 , TIRE_HEIGHT_FLOOR ,0]);
        multRotationX(90);
        //criar constante
        multScale([TIRE_DIAMETER/6, TANK_DEPT, TIRE_DIAMETER/6 ]);

        uploadColor(vec3(0.78,0.761,0.929));
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }



    function pairWheels(){

        multTranslation([0, TIRE_HEIGHT_FLOOR, 0]);
        pushMatrix();
            //criar constante
            multTranslation([0,0 , -TANK_DEPT/2]);
            wheel();
        popMatrix();
        pushMatrix();
            //criar constante
            multTranslation([0, 0, TANK_DEPT/2]);
            wheel();
        popMatrix();

        
        
  
    }

    //wheels
    function wheel(){
        //ver se rot funciona
        multRotationZ(rot);
        pushMatrix();
            tire();
        popMatrix();

        pushMatrix();
            rim();
        popMatrix();
        
    }


    //tire
    function tire(){
        multRotationX(90);
        multScale([TIRE_DIAMETER_SCALE,TIRE_DEPT,TIRE_DIAMETER_SCALE]);
        
        uploadColor(vec3(0.584,0.49,0.678));
        uploadModelView();
        TORUS.draw(gl, program, mode);
    }

    //Tire rim
    function rim(){  
        
        multScale([TIRE_DIAMETER_SCALE,TIRE_DIAMETER_SCALE,RIM_DEPT_SCALE]);

        uploadColor(vec3(1,1,1));
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    } 

    //projetile
    function projetile(){

        uploadColor(vec3(1,1,1));
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        
    }


    function fireProjetile(){

        time += FRAME_RATE;

        //obter WC
        let WC = mult(inverse(mView),lastMV);

        let x0 = mult(WC,vec4(0,0,0,1));

        //speed = 3
        let v0 = mult(normalMatrix(WC),vec4(0,3,0,0));

        //x = x0 + v0*time + (9,8*0.5)*time*time;
        let gravity = vec4(0,-9.8,0,0);
      
        let x = add(x0, add(scale(time,v0),scale(0.5*time*time,gravity)));
        //console.log(x);

        if(x[1] <= 0)
        fired = false;

        pushMatrix();
            //multTranslation([0,0, 0]);
            multTranslation([x[0], x[1], x[2]]);
            multScale([BARREL_HEIGHT,BARREL_HEIGHT,BARREL_DEPT]);
            //multScale([5,5,5]);
            projetile();
        popMatrix();

    }




    function render(){
    
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));


        loadMatrix(mView);

        //meter constante e maybe mandar já tudo para o meio
        
            pushMatrix();
                multTranslation([FLOOR_HEIGHT,0,FLOOR_HEIGHT]);
                floor();
            popMatrix();
            
            pushMatrix();
                multTranslation([CENTER + mov,FLOOR_HEIGHT/2,CENTER]);
                tank();
            popMatrix();
            pushMatrix();
                if(fired){

                    fireProjetile();
                }
               
               
    
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))