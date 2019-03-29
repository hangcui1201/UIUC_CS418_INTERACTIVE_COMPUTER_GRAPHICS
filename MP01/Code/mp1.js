var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;
var vertexColorBuffer;      // Create a place to store vertex colors

var mvMatrix = mat4.create();
var rotAngle = 0;
var lastTime = 0;

//
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

// convert degree to radian
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//************************ take this code from HelloAnimation.js ******************//

// To test if the browser support WebGL
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

// load shader from Document Object Model of corresponding id
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

// setup vertex and fragment shader
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  
}

//**********************************************************************************//




// **************** need to modify the code below to draw badge ****************** // 

// setup vertex position buffer and vertex color buffer
function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
          -0.80,  0.90,  0.0,
          -0.80,  0.60,  0.0,
          -0.50,  0.60,  0.0,
          -0.80,  0.90,  0.0,
          -0.50,  0.60,  0.0,
           0.80,  0.90,  0.0,        
          -0.50,  0.60,  0.0,
          -0.25,  0.60,  0.0,
           0.80,  0.90,  0.0, 
          -0.25,  0.60,  0.0,
           0.25,  0.60,  0.0,
           0.80,  0.90,  0.0, 
           0.25,  0.60,  0.0,
           0.50,  0.60,  0.0,
           0.80,  0.90,  0.0, 
           0.50,  0.60,  0.0,
           0.80,  0.60,  0.0,
           0.80,  0.90,  0.0, 
          -0.50,  0.60,  0.0, 
          -0.50, -0.25,  0.0, 
          -0.25,  0.60,  0.0,  
          -0.50, -0.25,  0.0, 
          -0.25, -0.25,  0.0, 
          -0.25, -0.05,  0.0,
          -0.50, -0.25,  0.0, 
          -0.25, -0.05,  0.0,
          -0.25,  0.40,  0.0,
          -0.50, -0.25,  0.0, 
          -0.25,  0.40,  0.0,
          -0.25,  0.60,  0.0,
          -0.25, -0.05,  0.0,
          -0.15, -0.05,  0.0,
          -0.15,  0.40,  0.0,
          -0.25, -0.05,  0.0,
          -0.15,  0.40,  0.0,
          -0.25,  0.40,  0.0,
      
           0.15, -0.05,  0.0,
           0.25, -0.05,  0.0,
           0.15,  0.40,  0.0,
      
           0.15,  0.40,  0.0,
           0.25, -0.05,  0.0,
           0.25,  0.40,  0.0,
    
           0.25, -0.05,  0.0,
           0.25, -0.25,  0.0,
           0.50, -0.25,  0.0,
      
           0.25, -0.05,  0.0,
           0.50, -0.25,  0.0,
           0.25,  0.40,  0.0,

           0.25,  0.40,  0.0,
           0.50, -0.25,  0.0,
           0.25,  0.60,  0.0,
      
           0.25,  0.60,  0.0,
           0.50, -0.25,  0.0,
           0.50,  0.60,  0.0,
      
          -0.50, -0.30,  0.0,
          -0.50, -0.40,  0.0,
          -0.425, -0.30,  0.0,
      
          -0.50, -0.40,  0.0,
          -0.425, -0.45,  0.0,
          -0.425, -0.30,  0.0,
      
           0.50, -0.30,  0.0,
           0.425, -0.45,  0.0,
           0.50, -0.40,  0.0,
      
           0.425, -0.30,  0.0,
           0.425, -0.45,  0.0,
           0.50, -0.30,  0.0,
      
           -0.325, -0.30,  0.0,
           -0.325, -0.516,  0.0,
           -0.25, -0.30,  0.0,
      
           -0.325, -0.516,  0.0,
           -0.25, -0.566,  0.0,
           -0.25, -0.30,  0.0,
      
            0.25, -0.30,  0.0,
            0.25, -0.566,  0.0,
            0.325, -0.516,  0.0,
      
            0.25, -0.30,  0.0,
            0.325, -0.516,  0.0,
            0.325, -0.30,  0.0, 
      
           -0.15, -0.30,  0.0,
           -0.15, -0.633,  0.0,
           -0.075, -0.683,  0.0,
      
           -0.15, -0.30,  0.0,
           -0.075, -0.683,  0.0,
           -0.075, -0.30,  0.0,

            0.075, -0.30,  0.0,
            0.075, -0.683,  0.0,
            0.15, -0.30,  0.0,
      
            0.15, -0.30,  0.0,
            0.075, -0.683,  0.0,
            0.15, -0.633,  0.0
      
      
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 90;
    
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,  
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
      
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
      
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
      
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
      
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
      
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
      
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0

    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 90;  
}

//**********************************************************************************//

// draw the each frame in a determined rate
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  
  mat4.identity(mvMatrix);
  //mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));  
    
  mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotAngle));  
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
    
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}


//**********************************************************************************//

var sinscalar = 0;

// setup a predefined vertex positions using sin() function, update rotAngle and the value used by sin() function
function animate() {
    
    rotAngle= (rotAngle+1.0) % 360;
    sinscalar += 0.1;              
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
    var triangleVertices = [
        
          -0.80+Math.sin(sinscalar)*0.1,  0.90,  0.0,
          -0.80+Math.sin(sinscalar)*0.1,  0.60,  0.0,
          -0.50+Math.sin(sinscalar)*0.1,  0.60,  0.0,
        
          -0.80+Math.sin(sinscalar)*0.1,  0.90,  0.0,
          -0.50+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.80+Math.sin(sinscalar)*0.1,  0.90,  0.0,    
        
          -0.50+Math.sin(sinscalar)*0.1,  0.60,  0.0,
          -0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.80+Math.sin(sinscalar)*0.1,  0.90,  0.0, 
        
          -0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.80+Math.sin(sinscalar)*0.1,  0.90,  0.0, 
        
           0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.50+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.80+Math.sin(sinscalar)*0.1,  0.90,  0.0, 
        
           0.50+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.80+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.80+Math.sin(sinscalar)*0.1,  0.90,  0.0, 
        
          -0.50+Math.sin(sinscalar)*0.1,  0.60,  0.0, 
          -0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0, 
          -0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,  
        
          -0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0, 
          -0.25+Math.sin(sinscalar)*0.1, -0.25,  0.0, 
          -0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
        
          -0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0, 
          -0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
          -0.25+Math.sin(sinscalar)*0.1,  0.40,  0.0,
        
          -0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0, 
          -0.25+Math.sin(sinscalar)*0.1,  0.40,  0.0,
          -0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,
        
          -0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
          -0.15+Math.sin(sinscalar)*0.1, -0.05,  0.0,
          -0.15+Math.sin(sinscalar)*0.1,  0.40,  0.0,
        
          -0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
          -0.15+Math.sin(sinscalar)*0.1,  0.40,  0.0,
          -0.25+Math.sin(sinscalar)*0.1,  0.40,  0.0,
      
           0.15+Math.sin(sinscalar)*0.1, -0.05,  0.0,
           0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
           0.15+Math.sin(sinscalar)*0.1,  0.40,  0.0,
      
           0.15+Math.sin(sinscalar)*0.1,  0.40,  0.0,
           0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
           0.25+Math.sin(sinscalar)*0.1,  0.40,  0.0,
    
           0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
           0.25+Math.sin(sinscalar)*0.1, -0.25,  0.0,
           0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0,
      
           0.25+Math.sin(sinscalar)*0.1, -0.05,  0.0,
           0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0,
           0.25+Math.sin(sinscalar)*0.1,  0.40,  0.0,

           0.25+Math.sin(sinscalar)*0.1,  0.40,  0.0,
           0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0,
           0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,
      
           0.25+Math.sin(sinscalar)*0.1,  0.60,  0.0,
           0.50+Math.sin(sinscalar)*0.1, -0.25,  0.0,
           0.50+Math.sin(sinscalar)*0.1,  0.60,  0.0,
        
          -0.50+Math.sin(sinscalar)*0.03, -0.30,  0.0, 
          -0.50+Math.sin(sinscalar)*0.03, -0.40-Math.sin(sinscalar)*0.08,  0.0,
          -0.425, -0.30, 0.0,
      
          -0.50+Math.sin(sinscalar)*0.03, -0.40-Math.sin(sinscalar)*0.08,  0.0,
          -0.425, -0.45-Math.sin(sinscalar-0.25)*0.08,  0.0,
          -0.425, -0.30, 0.0,
        
           0.50-Math.sin(sinscalar)*0.03, -0.30,  0.0,
           0.425, -0.45-Math.sin(sinscalar)*0.08,  0.0,
           0.50-Math.sin(sinscalar)*0.03, -0.40-Math.sin(sinscalar)*0.08,  0.0,
      
           0.425, -0.30,  0.0,
           0.425, -0.45-Math.sin(sinscalar)*0.08,  0.0,
           0.50-Math.sin(sinscalar)*0.03, -0.30,  0.0,
        
           -0.325+Math.sin(sinscalar)*0.03, -0.30,  0.0,
           -0.325+Math.sin(sinscalar)*0.03, -0.516-Math.sin(sinscalar)*0.08,  0.0,
           -0.25, -0.30,  0.0,
      
           -0.325+Math.sin(sinscalar)*0.03, -0.516-Math.sin(sinscalar)*0.08,  0.0,
           -0.25, -0.566-Math.sin(sinscalar)*0.08,  0.0,
           -0.25, -0.30,  0.0,
        
            0.25, -0.30,  0.0,
            0.25, -0.566-Math.sin(sinscalar)*0.08,  0.0,
            0.325-Math.sin(sinscalar)*0.03, -0.516-Math.sin(sinscalar)*0.08,  0.0,
      
            0.25, -0.30,  0.0,
            0.325-Math.sin(sinscalar)*0.03, -0.516-Math.sin(sinscalar)*0.08,  0.0,
            0.325-Math.sin(sinscalar)*0.03, -0.30,  0.0, 
        
           -0.15+Math.sin(sinscalar)*0.03, -0.30,  0.0,
           -0.15+Math.sin(sinscalar)*0.03, -0.633-Math.sin(sinscalar)*0.08,  0.0,
           -0.075, -0.683-Math.sin(sinscalar)*0.08,  0.0,
      
           -0.15+Math.sin(sinscalar)*0.03, -0.30,  0.0,
           -0.075, -0.683-Math.sin(sinscalar)*0.08,  0.0,
           -0.075, -0.30,  0.0,
        
            0.075, -0.30,  0.0,
            0.075, -0.683-Math.sin(sinscalar)*0.08,  0.0,
            0.15-Math.sin(sinscalar)*0.03, -0.30,  0.0,
      
            0.15-Math.sin(sinscalar)*0.03, -0.30,  0.0,
            0.075, -0.683-Math.sin(sinscalar)*0.08,  0.0,
            0.15-Math.sin(sinscalar)*0.03, -0.633-Math.sin(sinscalar)*0.08,  0.0
      
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 90;
    
}


// initialize program load canvas 
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  //gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

// setup the timer
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

