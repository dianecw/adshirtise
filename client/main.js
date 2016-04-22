import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import '../imports/ui/body.js';
import '../imports/startup/accounts-config.js';
import { Advertisers } from '../imports/api/advertisers.js';

//import 'main.css';
$( document ).ready(function() {

    var progression = 0,
    progress = setInterval(function() 
    {
    	seconds = new Date().getSeconds()
        //$('#progress .progress-text').text(progression + '%');
        //$('#progress .progress-bar').css({'width':progression+'%'});
        if(progression == 100) {
            clearInterval(progress);
            alert('done');
            // var advertiser = Advertisers.find({}, {limit: 1});
            // alert(advertiser);
            // Advertisers.update({});
        } else
            $('#bid-timer').progress({
  				percent: (30 - ( seconds % 30))*(100/30),
  				showActivity: false
			});
			$('#bid-timer-label').text((30 - ( seconds % 30)).toString() + "s");

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
