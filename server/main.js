import { Meteor } from 'meteor/meteor';
Fiber = Npm.require('fibers');

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

  setInterval(function() 
    {
      seconds = new Date().getSeconds()
      percentage = (30 - ( seconds % 30))*(100/30);
      // console.log(percentage);
      if (percentage == 100) {
        Fiber(function() {
          advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];

          best_bid = (Bids.find({round: advertiser.round}, {limit:1, sort: {value: -1}})).fetch()[0];
          if (best_bid === undefined) {
            msg = "No current ad."
          } else {
            msg = best_bid.msg;
          }
          Advertisers.update(advertiser._id, {$set: {curr_msg: msg, round: Number(advertiser.round) + 1}});

        }).run();
        
      }

    }, 1000);

Accounts.onCreateUser(function(options, user) {
    //pass the surname in the options
    user.avatar = "/images/1.jpg";
    if (options.profile)
      user.profile = options.profile;
    return user;
    //user.profile['avatar'] = "/images/1.jpg"

    //return user
});

Api.addRoute('advertisers/:id/population', {authRequired: false}, {
  put: function () {
    return Advertisers.update(this.urlParams.id, {$set: {population: this.bodyParams.population}});
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

