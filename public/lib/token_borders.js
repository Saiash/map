
function token_Border(imageData) {
        var nPixels = imageData.data.length;
        var r = this.getAttr('red');
        var g = this.getAttr('green');
        var b = this.getAttr('blue');
        var diff = 20;
        var offsetx = 1;
        var offsety = 0;
        var border_width = 10;
        if (imageData.width < 30) {
          offsetx = 0;
          offsety = 0; 
          border_width = 8; 
        }
        var middle = {x: Math.ceil(imageData.width/2)+offsetx, y: Math.ceil(imageData.height/2)+offsety};
        var real_radius = Math.sqrt((middle.x-border_width)*(middle.x-border_width)+(middle.y-border_width)*(middle.y-border_width));
        for (var i = 3; i < nPixels; i += 4) {

            var x = (i+1)/4; 
            var y = Math.floor(x/imageData.width);  
            x = x%imageData.width;
          
            if (((imageData.data[i-1] - imageData.data[i-2] < diff && 
               imageData.data[i-1] - imageData.data[i-3] < diff && 
               imageData.data[i-3] - imageData.data[i-2] < diff) ||
               
               (imageData.data[i-1] - imageData.data[i-2] > -diff &&
               imageData.data[i-1] - imageData.data[i-3] > -diff &&
               imageData.data[i-3] - imageData.data[i-2] > -diff)) && imageData.data[i] > 0) {
              
                var radius = Math.sqrt((x - middle.x)*(x - middle.x)+(y - middle.y)*(y - middle.y));
                if (radius > real_radius) {
                  imageData.data[i-3] = r;
                  imageData.data[i-2] = g;
                  imageData.data[i-1] = b;
                }
            }
        }
}