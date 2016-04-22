import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Bids } from '..//api/bids.js';
import { Advertisers } from '..//api/advertisers.js';

 
import './body.html';
import './topbar.html'
import './bid_steps.html'
import './user_menu.html'
//import './loginButtons.html'
 
Template.body.onCreated(function bodyOnCreated() {
  //this.state = new ReactiveDict();
  Meteor.subscribe('bids');
});

Template.bid_steps.onRendered(function(){
    $('.new-bid').validate({
        rules: {
            msgtext: {
                minlength: 1
            },
            text: {
              minlength: 6
            }

        }
    });
});

Template.body.helpers({

  bids() {
    advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    return Bids.find({round: advertiser.round}, {
      sort: { value: -1 },
      limit: 10
    });
  },
});

Template.body.events({
  'submit .new-bid'(event) {
    // Prevent default browser form submit
    event.preventDefault();
 
    // Get value from form element
    const target = event.target;
    const value = target.text.value;
    var msg = document.getElementById('msg').value;
   
    // Insert a task into the collection

    var advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    Bids.insert({
      value: Number(value),
      createdAt: new Date(), // current time
      owner: Meteor.userId(),
      username: Meteor.user().username,
      msg: msg,
      round: advertiser.round});


 
    // Clear form
    target.text.value = '';
  },
});