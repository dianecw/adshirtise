import { Mongo } from 'meteor/mongo';
 
export const Bids = new Mongo.Collection('bids');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('bids', function bidsPublication(limit) {
  	advertiser = (Advertisers.find({}, {limit: 1}).fetch())[0];
    return Bids.find({round: advertiser.round}, {
    limit: limit || 5,
    sort: { value: -1 }
  	});
  });
}