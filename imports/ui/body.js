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
  },
  'click .send-texts': function(e) {
    if ($('.send-texts').find('input').prop('checked')){
      Meteor.call('enableTexts', true);
    } else {
      Meteor.call('enableTexts', false);
    }
  },

});


Template.user_menu.onRendered(function () {
   $('.send-texts').checkbox({
    onChecked: function() {
      console.log("toggled!")
    },
    onUnchecked: function() {
      console.log("untoggled!")
    }
  });

});

Template.bid_steps.events({
  'click .explore.input': function(e){
    //console.log($(e.target).parent());
    $(".explore.input").removeClass("explore-active");
    $(e.target).parent().addClass("explore-active");
    $(".explore.input").removeClass("active");
    $(e.target).parent().addClass("active");
  },
  });

Template.user_ads.events({
  'click .saved.input': function(e){
    //console.log($(e.target).parent());
    $(".saved.input").removeClass("saved-active");
    $(e.target).parent().addClass("saved-active");
    $(".saved.input").removeClass("active");
    $(e.target).parent().addClass("active");
  },

  'click': function(e){

  $(".delete-saved").click(function(e){
    Meteor.users.update({_id:Meteor.user()._id}, 
        { $pull: {"profile.ads": { _id: parseInt(this.id)}} });
  });},
  });
 
Template.body.onCreated(function bodyOnCreated() {
  //this.state = new ReactiveDict();
  Meteor.subscribe('bids');
  Meteor.subscribe('userData');
  Meteor.subscribe('advertisers');

});

function hex2rgb(hex) {
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
  return rgb;
}

calculate_min = function() {

  advertiser = (Advertisers.find({}, {limit: 1, sort: { value: -1 }}).fetch())[0];
  if (advertiser === undefined) {
    return 0;
  }
  else if (advertiser.population !== undefined) {
    if (advertiser.population < 100) return 0;
    else if (advertiser.population >= 100 && advertiser.population < 1000) return 5;
    else if (advertiser.population >= 1000 && advertiser.population < 5000) return 10;
    else if (advertiser.population >= 5000) return 20;
   } else {
    return 0;
  }
};

//default red
var textColor = hex2rgb("#db2828");





$.validator.addMethod( 'enoughMoney', ( money ) => {
  user = (Meteor.users.find({'username': Meteor.user().username}).fetch())[0];
  return user.money >= money ? true : false;
});

$.validator.addMethod( 'minMoney', ( money ) => {
  return calculate_min() <= Number(money) ? true : false;
});



Template.user_ads.helpers({
  activateRadioBtns() {
    $('.ui.radio.checkbox').checkbox();
  },
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

  is_admin(){
    return Meteor.user().username == "admin"
  }
});

Template.bid_user.helpers({
  popularity() {
    advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    if (advertiser.population !== undefined) {
      return Math.round(advertiser.population/1000 + (Math.random() * 100) + 1); // some calculation should go here
    } 
    return 0;
  },
  image_feed() {
    advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    if (advertiser.face_img !== undefined) {
      return "data:image/jpeg;base64,".concat(advertiser.face_img);
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
    console.log("TEXT COLOR IS ", textColor);
    
    // Get value from form element
    const target = event.target;
    const value = target.text.value;
    var isText = true;
    if (currentTab == 'new-text'){
      var msg = document.getElementById('msg').value;
    } else if (currentTab == 'saved'){
      var msg = $('.saved-active').find('.real-msg').text().trim()
      isText = $('.saved-active').find('.is-text').text().trim() == "Text";
    } else if (currentTab == 'new-image') {
      isText = false;
      canvas = $('.rainbow-pixel-canvas')[0]
      var jpegUrl = canvas.toDataURL("image/jpeg");
      var msg = jpegUrl.substring(23, jpegUrl.length);
    } else if (currentTab = 'explore') {
      isText = $('.explore-active').find('.is-text').text().trim() == "Text";
      var msg= $('.explore-active').find('.real-msg').text().trim();

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
      textColor: textColor,
      round: advertiser.round});

    if (isText && currentTab == 'new-text') {
      var save_ad = document.getElementById('save_ad_checkbox').checked;
    } else if (currentTab == 'new-image'){
      var save_ad = document.getElementById('save_ad_img_checkbox').checked;
    } else{
      var save_ad = false;
    }
    if (save_ad) {
    curr_user = Meteor.users.find({_id:Meteor.user()._id}).fetch()[0];
    if (curr_user.profile === undefined) {
      curr_ads_count = 0;
    } else {
      curr_ads_count = curr_user.profile.ads_count;
    }
    

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