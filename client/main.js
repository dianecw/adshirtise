import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import '../imports/ui/body.js';
import '../imports/startup/accounts-config.js';
import { Advertisers } from '../imports/api/advertisers.js';
import { Bids } from '../imports/api/bids.js';

//import 'main.css';
$( document ).ready(function() {

    //pop up for user profiles

    $('.profile-tabs .item').tab()
;


    function endBlackout(){
      $(".blackout").css("opacity", "0");
      $(".blackout").css("display", "none");
      $(".msgbox").css("display", "none");
    }

    //starts the pop-up
    function strtBlackout(){
      $(".blackout").css("display", "block");
      $(".blackout").css("opacity", ".75");
      $(".msgbox").css("display", "block");
    }

    $(".bidding-profile").click(strtBlackout); // open if btn is pressed
    $(".blackout").click(endBlackout); // close if click outside of popup

    //read only star ratings
    $('.ui.rating')
        .rating('disable')
      ;

    //popups
    $('.flame-icon')
      .popup()
    ;
    $('.ui.checkbox').checkbox();


    var progression = 0,
    progress = setInterval(function() 
    {
    	seconds = new Date().getSeconds()
        //$('#progress .progress-text').text(progression + '%');
        //$('#progress .progress-bar').css({'width':progression+'%'});
        progression = (60 - ( seconds % 60))*(100/60);
        if(progression == 100) {
          advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
          winning_user = (Bids.find({round: advertiser.round}, {
            sort: { value: -1 },
            limit: 1}).fetch())[0];
          if (winning_user !== undefined && winning_user.username === Meteor.user().username) {
            $('.small.modal')
              .modal('show')
            ;
          }
            // var advertiser = Advertisers.find({}, {limit: 1});
            // alert(advertiser);
            // Advertisers.update({});
        } 
        $('#bid-timer').progress({
  			percent: (60 - ( seconds % 60))*(100/60),
  			showActivity: false
			});
			$('#bid-timer-label').text((60 - ( seconds % 60)).toString() + "s");

    }, 1000);


    });


//import './main.html';
/**
Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});
**/
