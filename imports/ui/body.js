import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Bids } from '..//api/bids.js';
import { Advertisers } from '..//api/advertisers.js';

import './bid_steps.js'
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

  $(".saved.item").click(function(e){
    $(".saved.item").removeClass("saved-active");
    $(this).addClass("saved-active");
    $(".saved.item").removeClass("active");
    $(this).addClass("active");
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

Template.ad.helpers({
  is_image(msg) {
    return msg.substring(0, 4) == "/9j/";
  },
  msg_to_im(msg) {
    return "data:image/jpeg;base64,".concat(msg);
  }
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

    var currentTab = $('.active.ad-menu').attr('data-tab')
 
    
    // Get value from form element
    const target = event.target;
    const value = target.text.value;
    var isText = true;
    if (currentTab == 'new-text'){
      var msg = document.getElementById('msg').value;
    } else if (currentTab == 'saved'){
      var msg = $('.saved-active').find('.real-msg').text().trim()
      isText = $('.saved-active').find('.label').text().trim() == "Text";
    } else if (currentTab == 'new-image') {
      isText = false;
      canvas = $('.rainbow-pixel-canvas')[0]
      var jpegUrl = canvas.toDataURL("image/jpeg");
      console.log(jpegUrl);
      var msg = jpegUrl.substring(23, jpegUrl.length);
    }
   
    // Insert a task into the collection

    var advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    Bids.insert({
      value: Number(value),
      createdAt: new Date(), // current time
      owner: Meteor.userId(),
      username: Meteor.user().username,
      msg: msg,
      isText: isText,
      round: advertiser.round});

    if (isText) {
      var save_ad = document.getElementById('save_ad_img_checkbox').checked;
    } else {
      var save_ad = document.getElementById('save_ad_checkbox').checked;
    }
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