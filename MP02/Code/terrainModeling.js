//-------------------------------------------------------------------------
/**
 * Sample code from course
 * Store each vertex coordinates to vertexArray
 * Use terrain.generate() to calculate height of each vertex
 * Calculate faceArray and normal for each face
 */
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray, normalArray){
	
  var deltaX=(maxX-minX)/n;
  var deltaY=(maxY-minY)/n;
  
  for(var i=0;i<=n;i++){
    for(var j=0;j<=n;j++){
        vertexArray.push(minX+deltaX*j);
        vertexArray.push(minY+deltaY*i);
        vertexArray.push(0);
		
		//normalArray.push(0);
		//normalArray.push(0);
        //normalArray.push(1);
    }
  }
  
  //-------------------------------------------------------------------------
  
  var terrain = new Terrain(n+1,0.3);  // 0.2 is the roughness
  
  // Calculate height for vertex using terrain.generate()
  terrain.generate();
  
  for(var x=0; x<=n; x++){
    for(var y=0; y<=n; y++){
		// For each vertex calculate the height and save it in the corresponding z coordinate 
        vertexArray[(x*(n+1)+y)*3+2] = 0.03 * terrain.get(x,y); 
    }
  }

  //-------------------------------------------------------------------------
  // Sample code from course
  // Save vertex index in faceArray
  var numT=0;
  for(var i=0;i<n;i++){
    for(var j=0;j<n;j++){
      var vid = i*(n+1) + j;
      faceArray.push(vid);
      faceArray.push(vid+1);
      faceArray.push(vid+n+1);
           
      faceArray.push(vid+1);
      faceArray.push(vid+1+n+1);
      faceArray.push(vid+n+1);
      numT+=2;
    }
  }

  //-------------------------------------------------------------------------
  // Calculate normal array for each face
  for(var x=0; x<=n; x++){
    for(var y=0; y<=n; y++){
		
      // Find three vertex for each face
      var vertex1 = vec3.fromValues(vertexArray[(x*(n+1)+y)*3], vertexArray[(x*(n+1)+y)*3+1], 
	                                vertexArray[(x*(n+1)+y)*3+2]);
									
      var vertex2 = vec3.fromValues(vertexArray[((x+1)*(n+1)+y)*3], vertexArray[((x+1)*(n+1)+y)*3+1], 
	                                vertexArray[((x+1)*(n+1)+y)*3+2]);
									
      var vertex3 = vec3.fromValues(vertexArray[(x*(n+1)+y+1)*3], vertexArray[(x*(n+1)+y+1)*3+1], 
	                                vertexArray[(x*(n+1)+y+1)*3+2]);
									
      // Declare edge and normal vector
      var edge1 = vec3.create();
      var edge2 = vec3.create();
      var normal = vec3.create();
	  
      // Calculate two edge vector and the normal vector = cross(edge1, edge2)
      vec3.subtract(edge1, vertex1, vertex2);
      vec3.subtract(edge2, vertex3, vertex2);
      vec3.cross(normal, edge1, edge2);
      vec3.normalize(normal, normal);
	  
      // Push result to normalArray
      normalArray.push(normal[0]);
      normalArray.push(normal[1]);
      normalArray.push(normal[2]);
    }
  }

  return numT;
}
//-------------------------------------------------------------------------
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

//-------------------------------------------------------------------------


