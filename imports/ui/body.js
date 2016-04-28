import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Bids } from '..//api/bids.js';
import { Advertisers } from '..//api/advertisers.js';

 
import './body.html';
import './topbar.html'
import './bid_steps.html'
import './user_menu.html'
import './bid_user.html'
import './user_profile.html'
import './user_ads.html'

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
Template.user_ads.events({
'click': function(e){

  $(".delete-saved").click(function(e){
    Meteor.users.update({_id:Meteor.user()._id}, 
        { $pull: {"profile.ads": { _id: parseInt(this.id)}} });
  });

  }
  });
 
Template.body.onCreated(function bodyOnCreated() {
  //this.state = new ReactiveDict();
  Meteor.subscribe('bids');
  Meteor.subscribe('userData');
  Meteor.subscribe('advertisers');
});

calculate_min = function() {
  advertiser = (Advertisers.find({}, {limit: 1, sort: { value: -1 }}).fetch())[0];
  if (advertiser === undefined) {
    return 0;
  }
  else if (advertiser.population !== undefined) {
    return advertiser.population; // some calculation should go here
  } else {
    return 0;
  }
};



$.validator.addMethod( 'enoughMoney', ( money ) => {
  user = (Meteor.users.find({'username': Meteor.user().username}).fetch())[0];
  return user.money >= money ? true : false;
});

$.validator.addMethod( 'minMoney', ( money ) => {
  return calculate_min() <= Number(money) ? true : false;
});

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

Template.user_ads.helpers({
  user_ads() {
    curr_user = Meteor.users.find({"username": Meteor.user().username});
    curr_user = curr_user.fetch()[0]
    if ('profile' in curr_user){
      return curr_user.profile.ads;
    }else {
      return None;
    }
  },

});

Template.bid_steps.helpers({
   min_bid() {
    return calculate_min();
  },
});

Template.user_menu.helpers({
  money(username1) {
    curr_user = Meteor.users.find({"username": username1});
    curr_user = curr_user.fetch()[0]
    return curr_user.money;
  },
});

Template.bid_user.helpers({
  popularity() {
    advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    if (advertiser.population !== undefined) {
      return advertiser.population; // some calculation should go here
    } 
    return 0;
  }
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

    var save_ad = document.getElementById('save_ad_checkbox').checked
    if (save_ad) {
    curr_user = Meteor.users.find({_id:Meteor.user()._id}).fetch()[0];
    curr_ads_count = curr_user.profile.ads_count
    if (curr_ads_count==null) {
    Meteor.users.update({_id:Meteor.user()._id}, 
      { $set: {"profile.ads_count": 1 }})
    }else{
    Meteor.users.update({_id:Meteor.user()._id}, 
      { $set: {"profile.ads_count": curr_ads_count + 1}})
    }

    //save the ad!
    Meteor.users.update({_id:Meteor.user()._id}, 
        { $push: {"profile.ads": { _id: Meteor.users.find({_id:Meteor.user()._id}).fetch()[0].profile.ads_count, msg: msg}} });
  }

 
    // Clear form
    target.text.value = '';
  },
});