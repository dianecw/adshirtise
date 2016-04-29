import './bid_steps.html'

Template.bid_steps.onRendered(function(){
  var paletteColor = "#000000";
  $('.palette').click(function(event)
  {
    event.preventDefault();
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
    // draw colored squares on move
    .on('dragmove', function (event) {
      var context = event.target.getContext('2d'),
          // calculate the angle of the drag direction
          dragAngle = 180 * Math.atan2(event.dx, event.dy) / Math.PI;

      // set color based on drag angle and speed
      // context.fillStyle = 'hsl(' + dragAngle + ', 86%, '
      //                     + (30 + Math.min(event.speed / 1000, 1) * 50) + '%)';
      context.fillStyle = paletteColor;

      // draw squares
      context.fillRect(event.pageX - pixelSize / 2, event.pageY - pixelSize / 2,
                       pixelSize, pixelSize);
    })
    // clear the canvas on doubletap
    .on('doubletap', function (event) {
      var context = event.target.getContext('2d');

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    });

    function resizeCanvases () {

      [].forEach.call(document.querySelectorAll('.rainbow-pixel-canvas'), function (canvas) {
        canvas.width = 32*pixelSize+1;
        canvas.height = 32*pixelSize+1;
      });
    }
    resizeCanvases();

    // interact.js can also add DOM event listeners
    interact(document).on('DOMContentLoaded', resizeCanvases);
    interact(window).on('resize', resizeCanvases);

  interact.maxInteractions(Infinity); 



});
