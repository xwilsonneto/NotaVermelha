const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

track:{
type:mongoose.Schema.Types.ObjectId,
ref:"Track",
required:true
}

},{timestamps:true});

likeSchema.index({user:1,track:1},{unique:true});
likeSchema.index({track:1});

module.exports = mongoose.model("Like",likeSchema);