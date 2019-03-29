/**
* @ main javascript file for the whole program.
*/

var gl;
var canvas;
var shaderProgram;

var skyBoxIndexBuffer;
var skyBoxVertexBuffer;

var teapotIndexBuffer;
var teapotVertexBuffer;
var teapotVertexNormalBuffer;

var cubeImage;
var cubeTexture;

// Matrix stack
var mvMatrixStack = [];

// Create ModelView Matrix => uMVMatrix
var mvMatrix = mat4.create();

// Create Projection Matrix => uPMatrix
var pMatrix = mat4.create();

// Create the Normal Transformation Matrix => uNMatrix
var nMatrix = mat3.create();

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,10.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);
var globalQuat = quat.create();

var originUp = vec3.fromValues(0.0, 1.0, 0.0);
var originEyePt = vec3.fromValues(0.0,0.0,10.0);

// ready variable
toDraw = false;

var next = 0;
var modelRotation = degToRad(0);

// Get by function parseObj()
var vertexNum;
var faceNum;

var vertexArray = [];  
var faceArray = [];   
var normalArray = [];
var vNormalArray = [];

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

/**
* Create quaternion to handle rotations
*/
function quatRotation(rotationRate, rotAxis){
	
    // create a new quaternion to apply new rotation
    var tempQuat = quat.create();
    quat.setAxisAngle(tempQuat, rotAxis, rotationRate);
    quat.normalize(tempQuat, tempQuat);
    
    // apply new rotation to global quaternion
    quat.multiply(globalQuat, tempQuat, globalQuat);
    quat.normalize(globalQuat, globalQuat);
}

/**
* Setup up key to rotate teapot as well as rotate scene around teapot
*/
function handleKeyDown(event){

	// left arrow -> rotate around teapot left
    if (event.keyCode == 37){
        quatRotation(-0.05, originUp);
        vec3.transformQuat(eyePt, originEyePt, globalQuat);
		vec3.normalize(viewDir, eyePt);
		vec3.scale(viewDir, viewDir, -1);
    }
	// right arrow -> rotate around teapot right
    else if (event.keyCode == 39){
        quatRotation(0.05, originUp);
        vec3.transformQuat(eyePt, originEyePt, globalQuat);
		vec3.normalize(viewDir, eyePt);
		vec3.scale(viewDir, viewDir, -1);
    }
	// A -> rotate teapot right
	else if (event.keyCode == 65){
		modelRotation += 0.05;
	}
	// D -> rotate teapot left
	else if (event.keyCode == 68){
		modelRotation -= 0.05;
	}
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

	// Enable vertex position
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	console.log("Vertex attrib: ", shaderProgram.vertexPositionAttribute);
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	// Enable vertex normals
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	// Enable matrix manipulations
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	
	// Enable Phong Shading options
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
	shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
	shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
	shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}

/**
* Parse teapot.obj and calculate teapot vertexArray, faceArray and vNormalArray
*/
function parseObj() {
    // parse data
	
	vertexNum = 0;
    faceNum = 0;
	
	var filename = "teapot.obj";
    var file = new XMLHttpRequest();
    var allText=[];
	
    file.open("GET", filename, false);
	
	file.onreadystatechange = function() {
		
        if (file.readyState === 4) {
            if (file.status === 200 || file.status == 0) {
				
                var text = file.responseText;
				
                console.log("Got text file!"); 
				
				var lines = text.split("\r\n");
				
				for(var i = 0; i < lines.length; i++){
					
					var slice = lines[i].split(/\s+/);
					
                    if (slice[0] == 'v'){
                        vertexNum++;
                        for (var k = 1; k < 4; k++)
                            vertexArray.push(parseFloat(slice[k]));
                        }
                    
					if (slice[0] == 'f'){
                        faceNum++;
                        for (var k = 1; k < 4; k++)
                        faceArray.push(parseInt(slice[k]-1));
                    }
                }
				
				for (var i = 0; i< 3606; i++){
                    vNormalArray[i] = 0;
                }
				
				for (var i = 0; i < 2256; i++){
					var v1 = vec3.fromValues(vertexArray[3*faceArray[3*i]], vertexArray[3*faceArray[3*i]+1], vertexArray[3*faceArray[3*i]+2]);
					var v2 = vec3.fromValues(vertexArray[3*faceArray[3*i+1]], vertexArray[3*faceArray[3*i+1]+1], vertexArray[3*faceArray[3*i+1]+2]);
					var v3 = vec3.fromValues(vertexArray[3*faceArray[3*i+2]], vertexArray[3*faceArray[3*i+2]+1], vertexArray[3*faceArray[3*i+2]+2]);

					var edge1 = vec3.create(); 
					var edge2 = vec3.create();
					var normal = vec3.create();
					vec3.subtract(edge1, v3, v2);
					vec3.subtract(edge2, v1, v2);
					vec3.cross(normal, edge1, edge2);
					vec3.normalize(normal, normal);

					// calculate per-vertex normal
					vNormalArray[3*faceArray[3*i]] += normal[0];
					vNormalArray[3*faceArray[3*i]+1] += normal[1];
					vNormalArray[3*faceArray[3*i]+2] += normal[2];

					vNormalArray[3*faceArray[3*i+1]] += normal[0];
					vNormalArray[3*faceArray[3*i+1]+1] += normal[1];
					vNormalArray[3*faceArray[3*i+1]+2] += normal[2];

					vNormalArray[3*faceArray[3*i+2]] += normal[0];
					vNormalArray[3*faceArray[3*i+2]+1] += normal[1];
					vNormalArray[3*faceArray[3*i+2]+2] += normal[2];

					normalArray.push(normal[0]);
					normalArray.push(normal[1]);
					normalArray.push(normal[2]);  
					
				}
				
				var temp = [];
				for (var i = 0; i < 1202; i++){
					var normal = vec3.create();
					normal[0] = vNormalArray[3*i];
					normal[1] = vNormalArray[3*i+1];
					normal[2] = vNormalArray[3*i+2];
					vec3.normalize(normal, normal);
					vNormalArray[3*i] = normal[0];
					vNormalArray[3*i+1] = normal[1];
					vNormalArray[3*i+2] = normal[2];
					// temp[i] = normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2];
				}  
	        }
        }
    }
	
	file.send(null);
	
}

/**
* Set up teapot buffer
*/
function setupTeapotBuffer(){
	
	parseObj(); 

	teapotVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
	teapotVertexBuffer.numItems = vertexNum;
	
    teapotVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vNormalArray), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = faceNum;
	
	// bind face data
    teapotIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexBuffer);
	
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faceArray), gl.STATIC_DRAW);
	teapotIndexBuffer.numItems = faceNum;
	
	// Global indicator that teapot can now be rendered
	toDraw = true;

	
}

/**
* Set up skybox buffer
*/
function setupSkyboxBuffer() {

  skyBoxVertexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, skyBoxVertexBuffer);

  var vertices = [
    // Front face
    -100.0, -100.0,  100.0,
     100.0, -100.0,  100.0,
     100.0,  100.0,  100.0,
    -100.0,  100.0,  100.0,

    // Back face
    -100.0, -100.0, -100.0,
    -100.0,  100.0, -100.0,
     100.0,  100.0, -100.0,
     100.0, -100.0, -100.0,

    // Top face
    -100.0,  100.0, -100.0,
    -100.0,  100.0,  100.0,
     100.0,  100.0,  100.0,
     100.0,  100.0, -100.0,

    // Bottom face
    -100.0, -100.0, -100.0,
     100.0, -100.0, -100.0,
     100.0, -100.0,  100.0,
    -100.0, -100.0,  100.0,

    // Right face
     100.0, -100.0, -100.0,
     100.0,  100.0, -100.0,
     100.0,  100.0,  100.0,
     100.0, -100.0,  100.0,

    // Left face
    -100.0, -100.0, -100.0,
    -100.0, -100.0,  100.0,
    -100.0,  100.0,  100.0,
    -100.0,  100.0, -100.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  skyBoxIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyBoxIndexBuffer);

  
  var cubeVertexIndices = [ 
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ]

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

/**
* Draw teapot
*/
function drawTeapot(){
	
	gl.uniform1f(gl.getUniformLocation(shaderProgram, "isSkybox"), false);
	
	gl.uniform3fv(gl.getUniformLocation(shaderProgram, "viewDir"), viewDir);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);  

	// Draw the cube.
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, 6768, gl.UNSIGNED_SHORT, 0);
}

/**
* Set up skybox
*/
function drawSkybox(){
	
	gl.uniform1f(gl.getUniformLocation(shaderProgram, "isSkybox"), true);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, skyBoxVertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, skyBoxVertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
	gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

	// Draw the cube.
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyBoxIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

/**
* Set camera location and viewing direction, 
* Rendering skybox and teapot for each frame
*/
function draw() { 

    var translateVec = vec3.create();
    var scaleVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
 
    // Setup the scene and camera
    mvPushMatrix();
	
	var rotateMatrix = mat4.create();
	
	mat4.rotateY(rotateMatrix, rotateMatrix, modelRotation);
	
	gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uRotateMat"), false, rotateMatrix);
	
    vec3.set(translateVec,0.0,0.0,-15.0);
	
    mat4.translate(mvMatrix, mvMatrix,translateVec);
	
    setMatrixUniforms();
	
    vec3.add(viewPt, eyePt, viewDir);
	
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);

	gl.uniform3fv(shaderProgram.uniformLightPositionLoc, [0,20,0]);
    gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, [0.0,0.0,0.0]);
    gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, [0.3,0.3,0.3]);
    gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, [0.3,0.3,0.3]);
	
	// draw skybox
    drawSkybox();

	if (toDraw){
		mat4.rotateY(mvMatrix,mvMatrix,modelRotation);
		drawTeapot();
	}
	
    mvPopMatrix();
  
}

/**
* Animation function
*/
function animate() {
    if (next == 0)
    {
    	next = Date.now();
    }
    else
    {
		now = Date.now();
		now *= 0.001;
		var deltaTime = now - next;
		next = now;  
    }
}

/**
* Setup Cubmap function
*/
function setupCubeMap() {
	
    // Initialize the Cube Map, and set its parameters
    cubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture); 
	
	// Set texture parameters
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR); 
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    
    // Load up each cube map face
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, 'images/pos-x.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, 'images/neg-x.png');    
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, 'images/pos-y.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, 'images/neg-y.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, 'images/pos-z.png');  
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, 'images/neg-z.png'); 
}

/**
* Load cubmap texture function
*/
function loadCubeMapFace(gl, target, texture, url){
    var image = new Image();
    image.onload = function()
    {
    	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
    image.src = url;
}

/**
* Start the program
*/
function startup() {
	canvas = document.getElementById("myGLCanvas");
	gl = createGLContext(canvas);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	document.onkeydown = handleKeyDown;

	setupShaders();
	setupSkyboxBuffer();
	setupTeapotBuffer();
	setupCubeMap();
	
	tick();
}

//----------------------------------------------------------------------------------
// Sample code from course
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

