import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Bids } from '..//api/bids.js';

 
import './body.html';
import './topbar.html'
import './bid_steps.html'
import './user_menu.html'
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
});

Template.body.helpers({

  bids() {
    return Bids.find({}, {
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