import { Mongo } from 'meteor/mongo';
 
export const Advertisers = new Mongo.Collection('advertisers');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('advertisers', function advertisersPublication(limit) {
    return Advertisers.find({}, {
    limit: limit || 1,
    sort: { value: -1 }
  	});
  });
}