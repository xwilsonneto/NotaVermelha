const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({

title:{
type:String,
required:true,
trim:true
},

artists:[{
type:mongoose.Schema.Types.ObjectId,
ref:"Artist",
required:true
}],

album:{
type:mongoose.Schema.Types.ObjectId,
ref:"Album"
},

duration:{
type:Number,
required:true
},

audioUrl:{
type:String,
required:true
},

waveform:{
type:[Number],
default:[]
},

coverUrl:String,

playCount:{
type:Number,
default:0
},

likeCount:{
type:Number,
default:0
},

isExplicit:{
type:Boolean,
default:false
},

releaseDate:{
type:Date,
default:Date.now
}

},{timestamps:true});

trackSchema.index({title:"text"});
trackSchema.index({artists:1});
trackSchema.index({playCount:-1});
trackSchema.index({releaseDate:-1});

module.exports = mongoose.model("Track",trackSchema);