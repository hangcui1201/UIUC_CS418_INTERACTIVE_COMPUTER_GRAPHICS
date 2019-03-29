/**
 * Terrain()
 * Set up Terrain struct and this.height() is 1D array for each (x,y) location
 * Input: length, roughness
 * Output: this.height
 */
function Terrain(length, roughness) {
	
  // length is the total vertic number of one edge
  this.size = length;
  
  // Create an array to store the z value for every (x,y) location
  // this.size * this.size is the total vertice number
  this.height = new Float32Array(this.size * this.size);
  
  // Set up roughness
  this.roughness = roughness;
}

//-------------------------------------------------------------------------

/**
 * set()
 * Set the height for (x,y) location. 
 * this.height is 1D array, so we need to calculate the index from x, y
 * Input: x,y,height
 * Output: this.height
 */
Terrain.prototype.set = function(x,y,height) {
    this.height[x + y * this.size] = height;
};

//-------------------------------------------------------------------------

/**
 * get()
 * Get the height for location (x,y)
 * Use x,y to calculate index and get height from this.height with index
 * Input: x,y
 * Output: height
 */
Terrain.prototype.get = function(x,y) {
    if (x>=0 && y>=0 && x<=this.size - 1 && y<=this.size - 1)
        return this.height[x + y * this.size];
    return 0;
};

//-------------------------------------------------------------------------

/**
 * divide()
 * Find out the square and diamond with recursion
 * Input: length, roughness
 * Output: this.height
 */
Terrain.prototype.divide = function(size){
	
    var x,y;
	
	// size = the number of squares at one edge
    var half = size/2;
	
    // Base Case: return if vertex all set
    if (half < 1)
        return;
	
    // Square: calculate the value of middle point by calling this.square()
    for(y = half; y < this.size - 1; y += size){
        for(x = half; x < this.size - 1; x += size){
            this.square(x, y, half, (Math.random()-0.5) * this.roughness * size);
        }
    }
	
    // Diamond: calculate the value of four diamonds by calling this.diamond()
    for(y = 0; y < this.size - 1; y += half){
        for(x = (y + half) % size; x < this.size - 1; x += size){
            this.diamond(x, y, half, (Math.random()-0.5) * this.roughness * size);
        }
    }
	
    // Call function itself with size/2
    this.divide(size/2);
	
};

//-------------------------------------------------------------------------

/**
 * square()
 * Get the value of four corners
 * Input: x, y, size, offset
 * Output: height
 */
Terrain.prototype.square = function(x, y, size, offset) {
	
    // Call this.average() and get average value of four corner
	// For example input (0,0), (128,0), (128,128), (0,128)
    var avg = this.average([
        this.get(x - size, y - size),   // upper left
        this.get(x + size, y - size),   // upper right
        this.get(x + size, y + size),   // lower right
        this.get(x - size, y + size)    // lower left
    ]);
	
    // Set the height of (x,y) to the average height of the four corners + the random offset
    this.set(x, y, avg + offset); 
	
};

//-------------------------------------------------------------------------

/**
 * diamond()
 * Get values for four middle points
 * Input: x, y, size, offset
 * Output: height
 */
Terrain.prototype.diamond = function(x, y, size, offset) {
    
	// Call this.average() and get average value of four middle point.
    var avg = this.average([
        this.get(x, y - size),      // bottom
        this.get(x + size, y),      // right
        this.get(x, y + size),      // top
        this.get(x - size, y)       // left
    ]);
	
    // set the height for (x,y)
    this.set(x, y, avg + offset) 
};

//-------------------------------------------------------------------------

/**
 * average()
 * Calculate the average of values that not equal to -1.
 * Input: values
 * Output: average
 */
Terrain.prototype.average = function(values) {
    
	// Filter the value that beyond boundary
    var valid = values.filter(function(val) { return val !== -1; });
    
	// Calculate sum
    var total = valid.reduce(function(sum, val) { return sum + val; }, 0);
	
    // Get average number.
    return total / valid.length;
};

//-------------------------------------------------------------------------

/**
 * generate()
 * Set the value for four corners and call divide to calculate each vertex
 * Input: none
 * Output: terrain
 */
Terrain.prototype.generate = function() {
    
	// Set value for four start corners
    var cornerHeight = 0;
	
	// Set all four corners' height to 0 at the corresponding index
    this.set(0, 0, cornerHeight);
    this.set(this.size - 1, 0, cornerHeight);
    this.set(this.size - 1, this.size - 1, cornerHeight);
    this.set(0, this.size - 1, cornerHeight);
	
    // call divide function to calcualte height for each point.
    this.divide(this.size - 1);
};


