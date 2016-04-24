import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Bids } from '..//api/bids.js';
import { Advertisers } from '..//api/advertisers.js';

 
import './body.html';
import './topbar.html'
import './bid_steps.html'
import './user_menu.html'
import './bid_user.html'

//import './loginButtons.html'


Template.user_menu.events({
    'click .dropdown.user .item': function(e) {
    $('.dropdown.user .item').click(function(){ 
      avatar_img = this.id;
      Meteor.users.update({_id:Meteor.user()._id}, 
        { $set: {"profile.avatar": [avatar_img]} });
      //Meteor.user.avatar = this.innerHTML;
      $('#current_avatar').attr('src', avatar_img);
      //console.log(avatar_img);
      //console.log(Meteor.user().profile.avatar);
    });
  }

  });
 
Template.body.onCreated(function bodyOnCreated() {
  //this.state = new ReactiveDict();
  Meteor.subscribe('bids');
  Meteor.subscribe('userData');
});

$.validator.addMethod( 'enoughMoney', ( money ) => {
  user = (Meteor.users.find({'username': Meteor.user().username}).fetch())[0];
  return user.money >= money ? true : false;
});

Template.bid_steps.onRendered(function(){
    advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    if (advertiser.population !== undefined) {
      min_amount = advertiser.population; // some calculation should go here
    } else {
      min_amount = 0;
    }

    $('.new-bid').validate({
        rules: {
            msgtext: {
              minlength: 1,
              required: true
            },
            text: {
              min: min_amount,
              enoughMoney: true,
              required: true
            }
        },
        messages: {
          text: {
            enoughMoney: "You do not have enough money to place this bid!"
          }
        }
    });
});



Template.bid_steps.helpers({
   min_bid() {
    advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    if (advertiser.population !== undefined) {
      return advertiser.population; // some calculation should go here
    } else {
      return 0;
    }
  },
});

Template.user_menu.helpers({
  money(username1) {
    curr_user = Meteor.users.find({"username": username1});
    curr_user = curr_user.fetch()[0]
    return curr_user.money;
  },
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

Template.bid.helpers({
  avatar_image(username1) {
    curr_user = Meteor.users.find({"username": username1});
    curr_user = curr_user.fetch()[0]
    if ('profile' in curr_user){
      return curr_user.profile.avatar
    }else {
      return "/images/1.jpg"
    }
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