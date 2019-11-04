var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');

var canvas = new Canvas(800,800);
var ctx = canvas.getContext('2d');

var args = process.argv.slice(2);
if (args.length < 2) {
    console.log("usage: render.js [INPUT JSON] [OUTPUT FILE]");
    return 1;
}

var inputJSONFile = args[0];
var inputJSONText = fs.readFileSync(inputJSONFile, 'utf-8');
var inputJSON = JSON.parse(inputJSONText.replace(/(\r\n|\n|\r)/gm,""));

var outputFile = args[1]

//CONSTANTS
var X_COUNT = 4
var Y_COUNT = 4

var WIDTH = canvas.width;
var HEIGHT = canvas.height;

var GRID_WIDTH = (WIDTH / Y_COUNT);
var GRID_HEIGHT = (HEIGHT / X_COUNT);

var PIXEL_SIZE = 4;

var GRID_WIDTH_PIXELS = (GRID_WIDTH / PIXEL_SIZE);
var GRID_HEIGHT_PIXELS = (GRID_HEIGHT / PIXEL_SIZE);

var C_PIX_H = (HEIGHT / PIXEL_SIZE);
var C_PIX_W = (WIDTH / PIXEL_SIZE);

var WALL_COLOR = 0;
var STREET_COLOR = 10;
var BUILDING_COLOR = 10;

var WALL_HORIZONTAL = "horizontal"
var WALL_VERTICAL = "vertical"

var PIXELS = new mdArray((HEIGHT / PIXEL_SIZE), (WIDTH / PIXEL_SIZE));

console.log("WIDTH: " + WIDTH);
console.log("HEIGHT: " + HEIGHT);
console.log("PIXEL_SIZE: " + PIXEL_SIZE);
console.log("GRID_WIDTH: " + GRID_WIDTH);
console.log("GRID_HEIGHT: " + GRID_HEIGHT);
console.log("GRID_WIDTH_PIXELS: " + GRID_WIDTH_PIXELS);
console.log("GRID_HEIGHT_PIXELS: " + GRID_HEIGHT_PIXELS);
//ENDCONSTANTS

this.saveBufferToImage = function(filename, buf) {
    fs.writeFileSync(filename, buf);
};

this.renderData = function(data) {
    // Store the current transformation matrix
    ctx.save();

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.WIDTH, canvas.HEIGHT);
    ctx.fillStyle = "gray"; //background color
    ctx.fillRect(0, 0, canvas.WIDTH, canvas.HEIGHT);

    // Restore the transform
    ctx.restore();

    var layout = this.getLayoutArray(data.layout.trim());

    this.printBuilding(layout);

    this.renderStreet(layout, data, ctx);
    this.renderBuilding(layout, data, ctx);
    this.shade(layout, ctx);

    //this.renderGrid(ctx);

    return canvas.toBuffer();
};

this.getLayoutArray = function(layoutString) {
    var returnArray = new mdArray(5,5);

    var row = 0;
    var col = 0;
    for (var index in layoutString) {
	if (col > 0 && col % 5 == 0) {
	    row++;
	}

	returnArray[row][col % 5] = layoutString[index];
	
	col++
    }

    return returnArray;
}

function mdArray(length) {
    var arr = new Array(length || 0),
    i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = mdArray.apply(this, args);
    }

    return arr;
}

// light up the building
this.shade = function(layout, ctx) {
    for (var col = 0 ; col < 5 ; col++) {
	for (var row = 0 ; row < 5 ; row++) {	    
	    var symbol = layout[row][col];
	    var ulCoord = this.getULCoord(row,col);

	    if (symbol != '*') {
		var intensity = 100;

		this.light(ulCoord, intensity, ctx);
	    }
	}
    }    
}

this.light = function(coord, intensity, ctx) {
    var fixed = this.fixXY(coord);

    var rowUL = fixed[4];
    var colUL = fixed[5];

    for (var light_num = 0 ; light_num < 1; light_num++) {
	var light_row_center = rowUL + Math.floor((GRID_WIDTH_PIXELS / 2));
	var light_col_center = colUL + Math.floor((GRID_HEIGHT_PIXELS / 2));

	var max_length = Math.ceil(Math.sqrt((C_PIX_H*C_PIX_H) + (C_PIX_W*C_PIX_W)));

	for (var deg = 0 ; deg < (Math.PI * 2) ; deg = deg + (Math.PI * 2) / 360) {
	    this.renderRay([light_row_center, light_col_center], deg, intensity);
	}
    }
}

this.renderRay = function(center, angle, intensity) {
    var centerRow = center[0];
    var centerCol = center[1];

    var length = 1;

    while (intensity > 0) {
	var xOff = Math.floor(Math.cos(angle) * length);
	var yOff = Math.floor((-1) * Math.sin(angle) * length);

	if (xOff == NaN) {
	    continue;
	}

	if (yOff == NaN) {
	    continue;
	}

	var pos = [centerRow + yOff, centerCol + xOff];
	var pixel = this.getPixel(pos);

	if (pixel != undefined) {
	    var isWall = this.pixelIsWall(pixel);
	    
	    if (isWall) {
		var wallDirection = this.wallDirection(pixel);

		var reflection;
		
		if (wallDirection == WALL_HORIZONTAL) {
		    if (angle < (Math.PI / 2)) {
			reflection = (-1 * angle) + (2 * Math.PI);
		    }
		} else {
		    var incidence = Math.PI - angle;
		    
		    reflection = Math.PI + angle;
		}

		if (reflection != undefined) {
		    this.renderRay(pos, reflection, intensity);
		}

		break;
	    } else {
		this.lightPixel(pixel, intensity, length, ctx);
		
		length = length + 1;
		intensity = intensity - 1;
	    }
	} else {
	    return;
	}
    }
}

this.isPixel = function(loc) {
    if ((PIXELS[loc[0]] != undefined) && (PIXELS[loc[0]][loc[1]]) != undefined) {
	return true;
    }

    return false
}

this.getPixel = function(loc) {
    if (this.isPixel(loc)) {
	return PIXELS[loc[0]][loc[1]];
    }

    return undefined;
}

this.wallDirection = function(wallPixel) {
    var OFFSET = 1;

    var xPixel = wallPixel.coord[1] / PIXEL_SIZE;
    var yPixel = wallPixel.coord[0] / PIXEL_SIZE;

    var pixelUpLoc = [xPixel - OFFSET, yPixel];
    var pixelDownLoc = [xPixel + OFFSET, yPixel];
    var pixelLeftLoc = [xPixel, yPixel - OFFSET];
    var pixelRightLoc = [xPixel, yPixel + OFFSET];

    var pixelUp = this.getPixel(pixelUpLoc);
    var pixelDown = this.getPixel(pixelDownLoc);
    var pixelLeft = this.getPixel(pixelLeftLoc);
    var pixelRight = this.getPixel(pixelRightLoc);

    if (this.pixelIsWall(pixelUp) || this.pixelIsWall(pixelDown)) {
	return WALL_VERTICAL;
    }

    if (this.pixelIsWall(pixelLeft) || this.pixelIsWall(pixelRight)) {
	return WALL_HORIZONTAL;
    }
    
    return undefined;
}

this.pixelIsWall = function(pixel) {
    if (pixel == undefined) {
	return false;
    }

    return pixel.wall;
}

this.lightPixel = function(pixel, maxIntensity, length, ctx) {
    var intensity = Math.floor(maxIntensity * (1 / (length / 4)));

    var oldID = ctx.getImageData(pixel.coord[0], pixel.coord[1], pixel.dim[0], pixel.dim[1]);
    var newID = ctx.createImageData(pixel.dim[0], pixel.dim[1]);

    for (var i=0;i<oldID.data.length;i+=4)
    {
	newID.data[i+0] = Math.min(255, oldID.data[i+0] + intensity);
	newID.data[i+1] = Math.min(255, oldID.data[i+1] + intensity);
	newID.data[i+2] = Math.min(255, oldID.data[i+2] + intensity);
	newID.data[i+3] = oldID.data[i+3];
    }

    ctx.putImageData(newID, pixel.coord[0], pixel.coord[1]);
}

this.colorPixel = function(pixel, maxIntensity, length, ctx) {
    var intensity = Math.floor(maxIntensity * (1 / (length / 4)));

    var oldID = ctx.getImageData(pixel.coord[0], pixel.coord[1], pixel.dim[0], pixel.dim[1]);
    var newID = ctx.createImageData(pixel.dim[0], pixel.dim[1]);

    for (var i=0;i<oldID.data.length;i+=4)
    {
	newID.data[i+0] = Math.min(255, 147);
	newID.data[i+1] = Math.min(255, 92);
	newID.data[i+2] = Math.min(255, 17);
	newID.data[i+3] = oldID.data[i+3];
    }

    ctx.putImageData(newID, pixel.coord[0], pixel.coord[1]);
}


this.renderStreet = function(layout, data, ctx) {
    for (var col = 0 ; col < 5 ; col++) {
	for (var row = 0 ; row < 5 ; row++) {	    
	    var symbol = layout[row][col];
	    var ulCoord = this.getULCoord(row,col);

	    if (symbol == '*') {
		this.renderStreetSquare(ulCoord, ctx);
	    }
	}
    }
}

this.renderBuilding = function(layout, data, ctx) {
    for (var col = 0 ; col < 5 ; col++) {
	for (var row = 0 ; row < 5 ; row++) {	    
	    var symbol = layout[row][col];
	    var ulCoord = this.getULCoord(row,col);

	    if (symbol != '*') {
		this.renderBuildingEdges(ulCoord, ctx);
		
		if (symbol != 'B') {
		    this.renderDoor(symbol, ulCoord, ctx);
		}
	    }
	}
    }
    
    for (var col = 0 ; col < 5 ; col++) {
	for (var row = 0 ; row < 5 ; row++) {	    
	    var symbol = layout[row][col];
	    var ulCoord = this.getULCoord(row,col);

	    if (symbol != '*') {
		this.renderBuildingSquare(ulCoord, ctx);
	    }
	}
    }
}

this.renderDoor = function(dir, coord, ctx) {
    if (dir == 'U') {
	for (var i = 10; i < GRID_WIDTH_PIXELS - 10; i++) {
	    pixelLocation = [coord[0] + (i * PIXEL_SIZE), coord[1] - PIXEL_SIZE];

	    this.renderPixel(pixelLocation, BUILDING_COLOR, ctx);
	}

	return;
    }

    if (dir == 'D') {
	for (var i = 10; i < GRID_WIDTH_PIXELS - 10; i++) {
	    pixelLocation = [coord[0] + (i * PIXEL_SIZE), coord[1] + GRID_WIDTH];

	    this.renderPixel(pixelLocation, BUILDING_COLOR, ctx);
	}

	return;
    }

    if (dir == 'L') {
	for (var i = 10; i < GRID_HEIGHT_PIXELS - 10; i++) {
	    pixelLocation = [coord[0] - PIXEL_SIZE, coord[1] + (i * PIXEL_SIZE)]

	    this.renderPixel(pixelLocation, BUILDING_COLOR, ctx);
	}

	return;
    }

    if (dir == 'R') {
	for (var i = 10; i < GRID_HEIGHT_PIXELS - 10; i++) {
	    pixelLocation = [coord[0] + GRID_HEIGHT, coord[1] + (i * PIXEL_SIZE)];

	    this.renderPixel(pixelLocation, BUILDING_COLOR, ctx);
	}

	return;
    }
}

this.renderBuildingEdges = function(coord, ctx) {
    var X = coord[0] - PIXEL_SIZE;
    var Y = coord[1] - PIXEL_SIZE;

    for (var col = 0 ; col < GRID_WIDTH_PIXELS + 2 ; col++) {
	for (var row = 0 ; row < GRID_HEIGHT_PIXELS + 2 ; row++) {
	    pixelLocation = [X + (col * PIXEL_SIZE), Y + (row * PIXEL_SIZE)];

	    this.renderPixel(pixelLocation, WALL_COLOR, ctx);
	}
    }
}

this.renderStreetSquare = function(coord, ctx) {
    var X = coord[0];
    var Y = coord[1];

    for (var col = 0 ; col < GRID_WIDTH_PIXELS ; col++) {
	for (var row = 0 ; row < GRID_HEIGHT_PIXELS ; row++) {
	    pixelLocation = [X + (col * PIXEL_SIZE), Y + (row * PIXEL_SIZE)];

	    this.renderPixel(pixelLocation, STREET_COLOR, ctx);
	}
    }
}

this.renderBuildingSquare = function(coord, ctx) {
    var X = coord[0];
    var Y = coord[1];

    for (var col = 0 ; col < GRID_WIDTH_PIXELS ; col++) {
	for (var row = 0 ; row < GRID_HEIGHT_PIXELS ; row++) {
	    pixelLocation = [X + (col * PIXEL_SIZE), Y + (row * PIXEL_SIZE)];

	    this.renderPixel(pixelLocation, BUILDING_COLOR, ctx);
	}
    }
}

this.renderPixel = function(coord, color, ctx) {
    var fixed = this.fixXY(coord);

    if (fixed == undefined) {
	return
    }

    var X = fixed[0];
    var Y = fixed[1];

    var pixX = fixed[2];
    var pixY = fixed[3];

    var row = fixed[4]
    var col = fixed[5]
    
    this.addPixel(row, col, [X, Y], [pixX, pixY], color);

    var id = ctx.createImageData(pixX, pixY);

    for (var i=0;i<id.data.length;i+=4)
    {
	id.data[i+0]=color;
	id.data[i+1]=color;
	id.data[i+2]=color;
	id.data[i+3]=255;
    }
    
    ctx.putImageData(id, X, Y);
}

function Pixel(coord, dim, color) {
    this.dim = dim;
    this.coord = coord;
    this.color = color;

    if (color == WALL_COLOR) {
	this.wall = true;
    } else {
	this.wall = false;
    }
}

this.addPixel = function(row, col, coord, dim, color) {
    if (PIXELS[row] != undefined) {
	PIXELS[row][col] = new Pixel(coord, dim, color);
    }
}

this.fixXY = function(coord) {
    var X = coord[0];
    var Y = coord[1];

    var pixX = PIXEL_SIZE;
    var pixY = PIXEL_SIZE;

    //discard completely ridiculous pixels
    if ((X < (-1 * PIXEL_SIZE)) || (Y < (-1 * PIXEL_SIZE))) {
	return undefined;
    }

    if ((X > WIDTH)||(Y > HEIGHT)) {
	return undefined;
    }

    var col = Math.floor(Math.max(0, X) / PIXEL_SIZE);
    var row = Math.floor(Math.max(0, Y) / PIXEL_SIZE);

    // don't modify if everything is kosher
    if ((X > 0) && (Y > 0) && (X + PIXEL_SIZE < WIDTH) && (Y + PIXEL_SIZE < HEIGHT)) {
	return [X, Y, PIXEL_SIZE, PIXEL_SIZE, row, col];
    }
    
    //trim overlapping pixels to the left and up
    var newX = X;
    var newY = Y;

    if ((X < 0)&&(X > (-1 * PIXEL_SIZE))) {
	newX = 0;
	pixX = PIXEL_SIZE - (-1 * X);
    }
    
    if ((Y < 0)&&(Y > (-1 * PIXEL_SIZE))) {
	newY = 0;
	pixY = PIXEL_SIZE - (-1 * Y);
    }
    
    // trim overlapping pixels to the right and down
    if (X + PIXEL_SIZE > WIDTH) {
	pixX = (WIDTH - X);
    }

    if (Y + PIXEL_SIZE > HEIGHT) {
	pixY = (HEIGHT - Y);
    }

    return [newX, newY, pixX, pixY, row, col];
}

this.printBuilding = function(layoutArray) {
    for (var row in layoutArray) {
	var rowString = ""
	for (var col in layoutArray[row]) {
	    rowString = rowString + "[" + layoutArray[row][col] + "]";
	}
	console.log(rowString);
    }
}

this.getULCoord = function(row, col) {
    var rawX = Math.max(0, col * GRID_WIDTH - (GRID_WIDTH / 2));
    var rawY = Math.max(0, row * GRID_HEIGHT - (GRID_HEIGHT / 2));

    rawX = Math.min(WIDTH, rawX);
    rawY = Math.min(HEIGHT, rawY);

    return [rawX, rawY];
}

this.renderGrid = function(ctx) {
    ctx.save()

    ctx.lineWidth = 1;

    ctx.strokeStyle = "#FFFFFF"

    //draw vertical lines
    for (var i = 0 ; i < X_COUNT ; i++) {
	ctx.beginPath();

	ctx.moveTo((GRID_WIDTH * i) + (GRID_WIDTH / 2), 0);
	ctx.lineTo((GRID_WIDTH * i) + (GRID_WIDTH / 2), HEIGHT);

	ctx.stroke();
    }

    //draw horizontal lines
    for (var i = 0 ; i < Y_COUNT ; i++) {
	ctx.beginPath();

	ctx.moveTo(0, (GRID_HEIGHT * i) + (GRID_HEIGHT / 2));
	ctx.lineTo(WIDTH, (GRID_HEIGHT * i) + (GRID_HEIGHT / 2));

	ctx.stroke();
    }

    ctx.restore()
}

this.saveBufferToImage(outputFile, this.renderData(inputJSON))
