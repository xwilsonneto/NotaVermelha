const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({

type:{
type:String,
enum:[
"track_release",
"album_release",
"playlist_created",
"user_follow",
"track_like"
],
required:true
},

actorUser:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

actorArtist:{
type:mongoose.Schema.Types.ObjectId,
ref:"ArtistProfile"
},

targetTrack:{
type:mongoose.Schema.Types.ObjectId,
ref:"Track"
},

targetAlbum:{
type:mongoose.Schema.Types.ObjectId,
ref:"Album"
},

targetPlaylist:{
type:mongoose.Schema.Types.ObjectId,
ref:"Playlist"
},

targetUser:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

},{timestamps:true});

activitySchema.index({createdAt:-1});
activitySchema.index({actorUser:1});
activitySchema.index({actorArtist:1});

module.exports = mongoose.model("Activity",activitySchema);