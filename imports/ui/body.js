import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Bids } from '..//api/bids.js';

 
import './body.html';
import './topbar.html'
import './bid_steps.html'
import './user_menu.html'
//import './loginButtons.html'
 
Template.body.onCreated(function bodyOnCreated() {
  //this.state = new ReactiveDict();
  Meteor.subscribe('bids');
});

Template.body.helpers({

  bids() {
    return Bids.find({}, {
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
    Bids.insert({
      value: value,
      createdAt: new Date(), // current time
      owner: Meteor.userId(),
      username: Meteor.user().username,
      msg: msg,
    });
 
    // Clear form
    target.text.value = '';
  },
});