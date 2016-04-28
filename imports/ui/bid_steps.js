import './bid_steps.html'

Template.bid_steps.onRendered(function(){

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
   
});
