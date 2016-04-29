import './bid_steps.html'
import './floodfill.js'

var fill_mode = false;

////////ok sorry for the huge function it won't import? if you can
//get it to feel free to uncomment the line and delete below

var floodfill = (function() {

  //MIT License
  //Author: Max Irwin, 2011,2016

  //Floodfill functions
  function floodfill(x,y,fillcolor,ctx,width,height,tolerance) {

    //Defaults and type checks for width and height
    width = (!isNaN(width)&&width) ? Math.min(Math.abs(width),ctx.canvas.width) : ctx.canvas.width;
    height = (!isNaN(height)&&height) ? Math.min(Math.abs(height),ctx.canvas.height) : ctx.canvas.height;

    //Maximum tolerance of 254, Default to 0
    tolerance = (!isNaN(tolerance)) ? Math.min(Math.abs(tolerance),254) : 0;

    var img = ctx.getImageData(0,0,width,height);
    var data = img.data;
    var length = data.length;
    var Q = [];
    var i = (x+y*width)*4;
    var e = i, w = i, me, mw, w2 = width*4;
    var targetcolor = [data[i],data[i+1],data[i+2],data[i+3]];

    if(!pixelCompare(i,targetcolor,fillcolor,data,length,tolerance)) { return false; }
    Q.push(i);
    while(Q.length) {
      i = Q.pop();
      if(pixelCompareAndSet(i,targetcolor,fillcolor,data,length,tolerance)) {
        e = i;
        w = i;
        mw = parseInt(i/w2)*w2; //left bound
        me = mw+w2;             //right bound
        while(mw<w && mw<(w-=4) && pixelCompareAndSet(w,targetcolor,fillcolor,data,length,tolerance)); //go left until edge hit
        while(me>e && me>(e+=4) && pixelCompareAndSet(e,targetcolor,fillcolor,data,length,tolerance)); //go right until edge hit
        for(var j=w;j<e;j+=4) {
          if(j-w2>=0      && pixelCompare(j-w2,targetcolor,fillcolor,data,length,tolerance)) Q.push(j-w2); //queue y-1
          if(j+w2<length  && pixelCompare(j+w2,targetcolor,fillcolor,data,length,tolerance)) Q.push(j+w2); //queue y+1
        }
      }
    }
    ctx.putImageData(img,0,0);
  }

  function pixelCompare(i,targetcolor,fillcolor,data,length,tolerance) {
    if (i<0||i>=length) return false; //out of bounds
    if (data[i+3]===0 && fillcolor.a>0) return true;  //surface is invisible and fill is visible

    if (
      (targetcolor[3] === fillcolor.a) &&
      (targetcolor[0] === fillcolor.r) &&
      (targetcolor[1] === fillcolor.g) &&
      (targetcolor[2] === fillcolor.b)
    ) return false; //target is same as fill

    if (
      (targetcolor[3] === data[i+3]) &&
      (targetcolor[0] === data[i]  ) &&
      (targetcolor[1] === data[i+1]) &&
      (targetcolor[2] === data[i+2])
    ) return true; //target matches surface

    if (
      Math.abs(targetcolor[3] - data[i+3])<=(255-tolerance) &&
      Math.abs(targetcolor[0] - data[i]  )<=tolerance &&
      Math.abs(targetcolor[1] - data[i+1])<=tolerance &&
      Math.abs(targetcolor[2] - data[i+2])<=tolerance
    ) return true; //target to surface within tolerance

    return false; //no match
  }

  function pixelCompareAndSet(i,targetcolor,fillcolor,data,length,tolerance) {
    if(pixelCompare(i,targetcolor,fillcolor,data,length,tolerance)) {
      //fill the color
      data[i]   = fillcolor.r;
      data[i+1] = fillcolor.g;
      data[i+2] = fillcolor.b;
      data[i+3] = fillcolor.a;
      return true;
    }
    return false;
  }

  return floodfill;

})();

Template.bid_steps.onRendered(function() { 
  var paletteColor = "#db2828";
  $('.palette').click(function(event)
  {
    event.preventDefault();
    if ($(this).hasClass("fill")) {
      fill_mode = true;
    }
    else {
      fill_mode = false;
    }
    if ($(this).hasClass("red")) {
      paletteColor = "#db2828";
    } else if ($(this).hasClass("orange")) {
      paletteColor = "#f26202";
    } else if ($(this).hasClass("yellow")) {
      paletteColor = "#fbbd08";
    } else if ($(this).hasClass("olive")) {
      paletteColor = "#b5cc18";
    } else if ($(this).hasClass("green")) {
      paletteColor = "#21ba45";
    } else if ($(this).hasClass("teal")) {
      paletteColor = "#00b5ad";
    } else if ($(this).hasClass("blue")) {
      paletteColor = "#2185d0";
    } else if ($(this).hasClass("violet")) {
      paletteColor = "#6435c9";
    } else if ($(this).hasClass("purple")) {
      paletteColor = "#a333c8";
    } else if ($(this).hasClass("pink")) {
      paletteColor = "#e03997";
    } else if ($(this).hasClass("brown")) {
      paletteColor = "#a5673f";
    } else if ($(this).hasClass("grey")) {
      paletteColor = "#767676";
    } else if ($(this).hasClass("black")) {
      paletteColor = "#000000";
    } else if ($(this).hasClass("erase")) {
      paletteColor = "#ffffff";
    } else if ($(this).hasClass("trash")) {
     var context = $('.rainbow-pixel-canvas')[0].getContext('2d');
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
  });

  $('.ad-menu.menu .item')
  .tab({history:false});

    $('.new-bid').validate({
        rules: {
            msgtext: {
              minlength: 1,
              required: true
            },
            text: {
              minMoney: true,
              enoughMoney: true,
              required: true
            }
        },
        messages: {
          text: {
            enoughMoney: "You do not have enough money to place this bid!",
            minMoney: "You must bid above the minimum price."
          }
        }
  });
   
  // For drawing image
  var pixelSize = 8;

  //getting canvas coords for clicks fml
  function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

/**
 * hex2rgb - function for converting hex colors to rgb(a)
 * 
 * Shout out to http://hex2rgba.devoth.com/
 *
 * @hex (String) - The hex value. Can be prefixed with "#" or not. Can be
 *   long format (6 chars) or short format (3 chars)
 * @opacity (number between 0 and 1) - This is an optional float value that
 *   will be used for the opacity
 * 
 * returns (Object) - an object with r, g, and b properties set as numbers
 *   along with a "css" property representing the css rule as a string
 */
function hex2rgba(hex) {
  hex = (hex + '').trim();

  var rgb = null
    , match = hex.match(/^#?(([0-9a-zA-Z]{3}){1,3})$/);

  if(!match) { return null; }
  
  rgb = {}

  hex = match[1];
  // check if 6 letters are provided
  if (hex.length == 6) {
    rgb.r = parseInt(hex.substring(0, 2), 16);
    rgb.g = parseInt(hex.substring(2, 4), 16);
    rgb.b = parseInt(hex.substring(4, 6), 16);
  }
  else if (hex.length == 3) {
    rgb.r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    rgb.g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    rgb.b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
  }

  rgb.a = 255;

  return rgb;
}

  function draw_px_click(event) {
    console.log("clciksds");
    var canvas = document.getElementById("canvas"); 
    coords = canvas.relMouseCoords(event);
    var context = event.target.getContext('2d');
    context.fillStyle = paletteColor;
    context.fillRect(coords.x - pixelSize / 2, coords.y - pixelSize / 2,
                       pixelSize, pixelSize);
  }

  function fill(event) {
    console.log("filling....");
    //TODO: DEBUG coordinates. ugh. 
    var canvas = document.getElementById("canvas"); 
    coords = canvas.relMouseCoords(event);
    var context = event.target.getContext('2d');
    var rgba_color = hex2rgba(paletteColor);
    floodfill(coords.x - pixelSize / 2, coords.y - pixelSize / 2, rgba_color, context);

  }


  function draw_px(event) {
    var context = event.target.getContext('2d');
    context.fillStyle = paletteColor;
    context.fillRect(event.pageX - pixelSize / 2, event.pageY - pixelSize / 2,
                       pixelSize, pixelSize);
  }

  interact('.rainbow-pixel-canvas')
    .snap({
      // snap to the corners of a grid
      mode: 'grid',
      // specify the grid dimensions
      grid: { x: pixelSize, y: pixelSize }
    })
    .origin('self')
    .draggable({
      max: Infinity,
      maxPerElement: Infinity
    })

    // draw colored squares on move, or on click
    .on('down', function(event) {
        if (fill_mode==true)
          fill(event);
    })

    .on('dragmove', draw_px, event)

    // clear the canvas on doubletap
    // .on('doubletap', function (event) {
    //   var context = event.target.getContext('2d');

    //   context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    // });

    function resizeCanvases () {
      //TODO make this not delete everything
      [].forEach.call(document.querySelectorAll('.rainbow-pixel-canvas'), function (canvas) {
        canvas.width = 32*pixelSize+1;
        canvas.height = 32*pixelSize+1;
        var context = canvas.context;
        var rgba_color = hex2rgba("#000000");
        floodfill(0, 0, rgba_color, context);
      });
    }
    resizeCanvases();

    // interact.js can also add DOM event listeners
    // interact(document).on('DOMContentLoaded', resizeCanvases);
    // interact(window).on('resize', resizeCanvases);

  interact.maxInteractions(Infinity); 



});
