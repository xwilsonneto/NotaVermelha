const mongoose = require("mongoose");

const followSchema = new mongoose.Schema({

follower:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

followingUser:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

followingArtist:{
type:mongoose.Schema.Types.ObjectId,
ref:"ArtistProfile"
}

},{timestamps:true});

followSchema.index({follower:1,followingUser:1},{unique:true,sparse:true});
followSchema.index({follower:1,followingArtist:1},{unique:true,sparse:true});

module.exports = mongoose.model("Follow",followSchema);