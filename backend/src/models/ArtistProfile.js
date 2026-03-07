const mongoose = require("mongoose");

const artistProfileSchema = new mongoose.Schema({

owner:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

name:{
type:String,
required:true,
trim:true
},

bio:String,

avatar:String,

coverImage:String,

genres:[String],

country:{
type:String,
default:"BR"
},

monthlyListeners:{
type:Number,
default:0
},

totalPlays:{
type:Number,
default:0
},

verified:{
type:Boolean,
default:false
},

socialLinks:{
website:String,
instagram:String,
twitter:String,
youtube:String
}

},{timestamps:true});

artistProfileSchema.index({name:"text"});
artistProfileSchema.index({monthlyListeners:-1});

module.exports = mongoose.model("ArtistProfile",artistProfileSchema);