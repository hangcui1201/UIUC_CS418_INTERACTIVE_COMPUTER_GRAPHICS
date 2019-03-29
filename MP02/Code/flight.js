
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create ModelView Matrix => uMVMatrix
var mvMatrix = mat4.create();

// Create Projection Matrix => uPMatrix
var pMatrix = mat4.create();

// Create the Normal Transformation Matrix => uNMatrix
var nMatrix = mat3.create();

// Create a place to store terrain geometry
var tVertexPositionBuffer;

//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,0.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// yawAxis is always (0,1,0)
var yawAxis = vec3.fromValues(0.0,1.0,0.0);
var right = vec3.fromValues(1.0,0.0,0.0);

// matrix stack
var mvMatrixStack = [];

// handle the flying speed in viewDir direction
var speed = 0.00;

// Code to handle user interactions
var currentlyPressedKeys = {};

// Sample code from course to key down event
// Change the button value to true when pressed.
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

// Sample code from course to key up event
// Clear the button value when released
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

//-------------------------------------------------------------------------

/**
 * Check particular key up/down events and set speed as well as RPY
 */
function handleKeys() {
	
	if(currentlyPressedKeys[38])        // Up Arrow
		pitch(1);                       // Pitch Up
    else if (currentlyPressedKeys[40])  // Down Arrow
        pitch(-1);                      // Pitch Down
	else
        pitch(0);                       // No Pitch Change
	
	
	if(currentlyPressedKeys[37])        // Left Arrow   
		roll(-1);                       // Roll Left     
	else if(currentlyPressedKeys[39])   // Right Arrow  
		roll(1);                        // Roll Right    
    else
		roll(0);                        // No Roll Change
	

    if(currentlyPressedKeys[87])        // W
		speed = 0.3;                    // Set speed = 0.3 
    else if(currentlyPressedKeys[83])   // S
		speed = 0.005;                  // Set speed = 0.005
    else
		speed = 0.03;                   // Set speed = 0.03
	

    if(currentlyPressedKeys[65])         // A
		yaw(1);                          // Yaw Left
    else if(currentlyPressedKeys[68])    // D
		yaw(-1);                         // Yaw Right
    else
		yaw(0);                          // No Yaw Change

}

//-------------------------------------------------------------------------

/**
 * Roll:
 * Roll with 'viewDir' direction axis
 * Input: angle (roll degree)
 */
function roll(angle){
	
  // Create a new identity quaternion
  var quate = quat.create();
  
  // Calculate the roll angle
  var rollAngle = speed * angle;
  
  // Create a quaternion from the given angle and rotation axis then returns it
  // quat.setAxisAngle = function(out, axis, rad){}
  quat.setAxisAngle(quate, viewDir, rollAngle);
  
  // Normalize the quaternion
  // quat.normalize = vec4.normalize;
  quat.normalize(quate,quate);
  
  // Change the axis according to rotation axis
  // vec3.transformQuat = function(out, a, q){}
  // Change up direction vector "up" with quate
  vec3.transformQuat(up,up,quate);
  
  // Normalize the up direction vector "up"
  vec3.normalize(up,up);
  
  // Change the 'right' axis 'x' axis using quate
  vec3.transformQuat(right,right,quate);
  vec3.normalize(right,right);
  
}

//-------------------------------------------------------------------------

/**
 * Pitch:
 * Change with the 'right' axis
 * Input: angle (pitch degree)
 */
function pitch(angle){
	
  // Create a new identity quaternion
  var quate = quat.create();
  
  // Calculate the roll angle
  var pitchAngle = speed * angle;
  
  // Create a quaternion from the given angle and rotation axis then returns it
  // quat.setAxisAngle = function(out, axis, rad){}
  quat.setAxisAngle(quate, right, pitchAngle);
  quat.normalize(quate,quate);
  
  // Change the axis according to rotation axis
  // vec3.transformQuat = function(out, a, q){}
  // Change up direction vector "up" with quate
  // Change viewDir direction vector "viewDir" with quate
  vec3.transformQuat(up,up,quate);
  vec3.transformQuat(viewDir,viewDir,quate);
  
  // Normalize "up" and "viewDir" vectors
  vec3.normalize(up,up);
  vec3.normalize(viewDir,viewDir);
}

//-------------------------------------------------------------------------

/**
 * Yaw:
 * Change axis according to the 'up' or 'yawAxis' axis
 * Input: angle (yaw degree)
 */
function yaw(angle){
	
  var quate = quat.create();
  var yawAngle = speed * angle;
  
  // Create a quaternion from the given angle and rotation axis then returns it
  // quat.setAxisAngle = function(out, axis, rad){}
  quat.setAxisAngle(quate, up, yawAngle);
  quat.normalize(quate,quate);
  
  // Change the axis according to rotation axis
  // vec3.transformQuat = function(out, a, q){}
  // Change right direction vector "right" with quate
  // Change viewDir direction vector "viewDir" with quate
  vec3.transformQuat(right,right,quate);
  vec3.transformQuat(viewDir,viewDir,quate);
  
  // Normalize "right" and "viewDir" vectors
  vec3.normalize(right,right);
  vec3.normalize(viewDir,viewDir);

}

//-------------------------------------------------------------------------
// Sample code from course to setup terrain buffers
function setupTerrainBuffers() {
    
    var vTerrain=[];  // vertexArray in terrainModeling.js
    var fTerrain=[];  // faceArray in terrainModeling.js
    var nTerrain=[];  // normalArray in terrainModeling.js
    var eTerrain=[];  // lineArray in terrainModeling.js
	
    var gridN = 128;   // setup number of suqares to generate (128 x 128)
    
	// numT is the number of total generated triangles, should be 2 x gridN x gridN
	// function terrainFromIteration() is defined in terrainModeling.js
    var numT = terrainFromIteration(gridN, -1,1,-1,1, vTerrain, fTerrain, nTerrain);
    // console.log("Generated ", numT, " triangles"); 
	
	// Create buffer for trianle vertex coordinates 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);  
    // vTerrain => vertexArray store the coordinates of each vertice    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1); // total vertice number
	
	// Create color buffer for each vertex 
	//vertexColorBuffer = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    //var colors = [

    //];
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    //vertexColorBuffer.itemSize = 4;
    //vertexColorBuffer.numItems = (gridN+1)*(gridN+1);  
	
    // Specify normals to be able to do lighting calculations
	// Create normal buffer for each vertex, one vertex <=> one normal
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain), gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1); // total normal number
    
    // Specify faces of the terrain 
	// fTerrain (faceArray) store the index of triangle vertices in sequence in terrainModeling.js
	// like [0]=0, [1]=1, [2]=4, [3]=1, [4]=5, [5]=4, [6]=1, [7]=2, [8]=5, [9]=2, [10]=6, [11]=5, ...
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain), gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3; //number of totoal vertices (bigger than the real number)
    
    //Setup Edges
	
	// function generateLinesFromIndexedTriangles() defined in terrainModeling.js
    generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
	
	// eTerrain (lineArray) store the lines of triangles in sequence
	// like line [0]-[1], [1]-[2], [2]-[0], [3]-[4], [4]-[5], [5]-[3], ....
    tIndexEdgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain), gl.STATIC_DRAW);
    tIndexEdgeBuffer.itemSize = 1;
    tIndexEdgeBuffer.numItems = eTerrain.length;
    
}

//-------------------------------------------------------------------------
// Sample code from course to draw terrain 
function drawTerrain(){
	
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                        gl.FLOAT, false, 0, 0);
						
 //gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
 //gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, 
 //                       gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize,
                        gl.FLOAT, false, 0, 0);   
    
 // Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);  
 
}

//-------------------------------------------------------------------------
// Sample code from course to draw terrain edges
function drawTerrainEdges(){
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

//-------------------------------------------------------------------------
// Sample code from course to upload ModelView Matrix to shader
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
// Sample code from course to upload Projection Matrix to shader
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

//-------------------------------------------------------------------------
// Sample code from course to upload Normal Matrix to shader
function uploadNormalMatrixToShader() {
  // nMatrix is the inverse transpose of the upper left 3x3 matrix of mvMatrix
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
// Sample code from course to push the current ModelView Matrix
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

//----------------------------------------------------------------------------------
// Sample code from course to pop the last matrix from the matrix stack
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
// Sample code from course to set Matrix Uniforms and upload to the shader
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
// Sample code from course to transfer degrees into radians
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
// Sample code from course to check browser WebGL support
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

//----------------------------------------------------------------------------------
// Sample code from course to load shaders 
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

//----------------------------------------------------------------------------------
// Sample code from course to setup shaders
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  
  //shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMatColor");  
 // shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMatColor");
 // shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMatColor");   
  
}


//----------------------------------------------------------------------------------
// Sample code from course to upload light properties to shader
// Called by function draw()
// loc => light source position in eye coordinate 
// a => Ia, d => Id, s => Is
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//-------------------------------------------------------------------------
/*
// Sample code from course to upload material properties to shader
// a => Ka, d => Kd, s => Ks
function uploadMaterialToShader(a,d,s) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
}
*/

//----------------------------------------------------------------------------------
// Sample code from course to setup terrian buffers
function setupBuffers() {
    setupTerrainBuffers();
}

//----------------------------------------------------------------------------------
// Sample code from course to draw the whole scene
function draw() { 

    var mvSpeedViewDir = vec3.create();
	var mvScale = vec3.create();

    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
	
	// Speed up/down by scaling the viewDir vector homogeously 
	// Scale viewDir vector by the value of speed, store the value in mvSpeedViewDir
	vec3.scale(mvSpeedViewDir, viewDir, speed);
	
	// Move eye point by add vector mvSpeedViewDir in viewDir direction
	vec3.add(eyePt, mvSpeedViewDir, eyePt);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
	
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    // Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,0.0,-3);   // Set transformVec = [0.0,0.0,-3.0]
	vec3.set(mvScale,15,15,15);            // Scale the terrian
	mat4.scale(mvMatrix, mvMatrix,mvScale);
    mat4.translate(mvMatrix, mvMatrix, transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(40));   
    
	// Set up light parameters
    var Ia = vec3.fromValues(1.0,1.0,1.0);
    var Id = vec3.fromValues(1.0,1.0,1.0);
    var Is = vec3.fromValues(1.0,1.0,1.0);
	
	// Set up material parameters    
    //var ka = vec3.fromValues(0.0,0.0,0.0);
    //var kd = vec3.fromValues(0.5,0.5,0.5);
    //var ks = vec3.fromValues(0.0,0.0,0.0);
	
	// Sample code on 9.30 Solar System 3
    // var lightPosEye4 = vec4.fromValues(0.0,0.0,50.0,1.0);
    // lightPosEye4 = vec4.transformMat4(lightPosEye4,lightPosEye4,mvMatrix);
	// var lightPosEye = vec3.fromValues(lightPosEye4[0],lightPosEye4[1],lightPosEye4[2]);
	// uploadLightsToShader(lightPosEye,Ia,Id,Is);
	// uploadMaterialToShader(ka,kd,ks);
	
	uploadLightsToShader([0,10,1],Ia,Id,Is);
    //uploadMaterialToShader(ka,kd,ks);
	
	setMatrixUniforms();	
    drawTerrain();
	
    // uploadLightsToShader([0,10,1],[0.3,0.3,0.3],[1.0,0.5,0.0],[1.0,1.0,1.0]);
    // drawTerrainEdges();

    /*
    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    {
      uploadLightsToShader([0,10,1],[0.3,0.3,0.3],[1.0,0.5,0.0],[0.2,0.2,0.2]);
      drawTerrain();
    }
    
    if(document.getElementById("wirepoly").checked){
      uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
      drawTerrainEdges();
    }

    if(document.getElementById("wireframe").checked){
      uploadLightsToShader([0,1,1],[1.0,1.0,1.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
      drawTerrainEdges();
    }
	*/
	
    mvPopMatrix();
  
}

//----------------------------------------------------------------------------------
function animate() {
   
}

//----------------------------------------------------------------------------------
// Sample code from course to start
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 1.0, 0.5);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  tick();
}

//----------------------------------------------------------------------------------
// Sample code from course for timer and refresh the frame
function tick() {
    requestAnimFrame(tick);
	handleKeys();
    draw();
    animate();
}

//----------------------------------------------------------------------------------












