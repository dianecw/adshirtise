import { Meteor } from 'meteor/meteor';
Fiber = Npm.require('fibers');

var cash_to_text = 0;
var exec = Npm.require('child_process').exec;
var Future = Npm.require('fibers/future');


 ENABLE_TEXTS = false; //turn me on to send texts

function send_text(money) {
  if (ENABLE_TEXTS) {
    console.log("sending...");
    const ACCOUNT_SID = 'AC5cf52e2ba03948f3ddb0d15efc732794';
    const AUTH_TOKEN = '845aeb7e0d858fbfe3ce19f2b11738e3';
    //TODO DELETE AFTER PUSHING!
    twilio = Twilio(ACCOUNT_SID, AUTH_TOKEN);
    twilio.sendSms({
      to:'+18053045062', // Any number Twilio can deliver to
      from: '+15103610038', // A number you bought from Twilio and can use for outbound communication
      body: "You've made $" + money + " so far!" // body of the SMS message
    }, function(err, responseData) { //this function is executed when a response is received from Twilio
      if (!err) { // "err" is an error received during the request, if any
        // "responseData" is a JavaScript object containing data received from Twilio.
        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
        console.log("SUCCESS");
        console.log(responseData.from); // outputs "+14506667788"
        console.log(responseData.body); // outputs "word to your mother."
      }
  });
  }
}

Meteor.methods({
    enableTexts: function(enable_texts) { 
      ENABLE_TEXTS = enable_texts;}
});


Meteor.startup(() => {
  // code to run on server at startup
Bids = new Mongo.Collection('bids');
Advertisers = new Mongo.Collection('advertisers');

if (Meteor.isServer) {

  // Global API configuration
  var Api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true
  });

  // Generates: GET, POST on /api/items and GET, PUT, DELETE on
  // /api/items/:id for the Items collection
  Api.addCollection(Bids);
  // Advertisers (which we will only have one of) will have a current ad and location.
  Api.addCollection(Advertisers); 

  Fiber(function() {
    advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    if (advertiser === undefined) {
      Advertisers.insert({round: 0, curr_msg: "No msg."});
    }
  }).run();

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

  setInterval(function() 
    {
      seconds = new Date().getSeconds()
      percentage = (60 - ( seconds % 60))*(100/60);

      if (percentage == 100) {
        Fiber(function() {
          advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];

          best_bid = (Bids.find({round: advertiser.round}, {limit:1, sort: {value: -1}})).fetch()[0];
          if (best_bid === undefined) {
            msg = "No current ad."
            isText = true;
            textColor = hex2rgb("#db2828");
          } else {
            msg = best_bid.msg;
            isText = best_bid.isText;
            textColor = best_bid.textColor;
            // Take money away from winning bidder.
            user = (Meteor.users.find({'username': best_bid.username}).fetch())[0];
            Meteor.users.update(user._id, {$set: {money: user.money - best_bid.value}});
            cash_to_text = cash_to_text + best_bid.value;
          
            if (best_bid.round % 5 == 0) { //sending a text every 5 rounds
              send_text(cash_to_text);
              console.log("POSTED WITH ", cash_to_text);

              cash_to_text = 0; //reset
            }
          }
          Advertisers.update(advertiser._id, {$set: {isText: isText, text_color: textColor, curr_msg: msg, round: Number(advertiser.round) + 1}});

          // Give random amount of money ($1-$500) to every user... Worried this could get really slow...
          var users_cursor = Meteor.users.find().forEach(function(obj){
            if (obj.money === undefined) {
              new_money = Math.floor((Math.random() * 5) + 1);
            } else {
              new_money = obj.money + Math.floor((Math.random() * 5) + 1);
              if (new_money < 0) {
                new_money = Math.pow(2,31) - 1;
              }
            }
            Meteor.users.update(obj._id, {$set: {money: new_money}}); 
          })
 
        }).run();
        
      }

    }, 1000);

Accounts.onCreateUser(function(options, user) {
    //pass the surname in the options
    user.money = 50;
    user.avatar = "/images/1.jpg";
    user.ads = [];
    if (options.profile)
      user.profile = options.profile;
    return user;
    //user.profile['avatar'] = "/images/1.jpg"

    //return user
});

Meteor.publish('userData', function() {
  if(!this.userId) return null;
  return Meteor.users.find(this.userId, {fields: {
    'money': 1,
  }});
});

Api.addRoute('advertisers/:id/population', {authRequired: false}, {
  put: function () {
    return Advertisers.update(this.urlParams.id, {$set: {face_img: this.bodyParams.image, population: this.bodyParams.population}});
  }
});

/**
  // Generates: POST on /api/users and GET, DELETE /api/users/:id for
  // Meteor.users collection
  Api.addCollection(Meteor.users, {
    excludedEndpoints: ['getAll', 'put'],
    routeOptions: {
      authRequired: true
    },
    endpoints: {
      post: {
        authRequired: false
      },
      delete: {
        roleRequired: 'admin'
      }
    }
  });

  // Maps to: /api/articles/:id
  Api.addRoute('articles/:id', {authRequired: true}, {
    get: function () {
      return Articles.findOne(this.urlParams.id);
    },
    delete: {
      roleRequired: ['author', 'admin'],
      action: function () {
        if (Articles.remove(this.urlParams.id)) {
          return {status: 'success', data: {message: 'Article removed'}};
        }
        return {
          statusCode: 404,
          body: {status: 'fail', message: 'Article not found'}
        };
      }
    }
  }); **/
}
});

