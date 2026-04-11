const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
{
email:{
type:String,
required:true,
unique:true,
lowercase:true,
trim:true
},

username:{
type:String,
required:true,
unique:true,
trim:true,
minlength:3
},

// Nome de exibição (ouvintes e bandas)
name:{
type:String,
trim:true,
default:""
},

password:{
type:String,
required:true,
select:false
},

role:{
type:String,
enum:["listener","artist","band","label","admin"],
default:"listener"
},

// Referência ao documento Artist (preenchido quando role === "band" | "artist")
artistId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Artist"
},

artistProfile:{
type:mongoose.Schema.Types.ObjectId,
ref:"ArtistProfile"
},

// Tracks que o usuário curtiu
likedTracks:[{
type:mongoose.Schema.Types.ObjectId,
ref:"Track"
}],

// Campos exclusivos de banda/artista independente
bandInfo:{
genre:{ type:String, default:"" },
city:{ type:String, default:"" },
bio:{ type:String, default:"" },
socialLinks:{
instagram:{ type:String, default:"" },
spotify:{ type:String, default:"" },
youtube:{ type:String, default:"" }
}
},

avatar:{
type:String,
default:"https://ui-avatars.com/api/?name=User"
},

bio:String,

followersCount:{
type:Number,
default:0
},

followingCount:{
type:Number,
default:0
},

isVerified:{
type:Boolean,
default:false
},

preferences:{
audioQuality:{
type:String,
enum:["low","medium","high"],
default:"medium"
},

explicitContent:{
type:Boolean,
default:true
}
},

subscription:{
type:{
type:String,
enum:["free","premium","family"],
default:"free"
},

expiresAt:Date
},

isActive:{
type:Boolean,
default:true
}

},
{timestamps:true}
);

userSchema.pre("save", async function(next){

if(!this.isModified("password")) return next();

const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password,salt);

next();

});

userSchema.methods.comparePassword = async function(password){

return bcrypt.compare(password,this.password);

};

module.exports = mongoose.model("User",userSchema);
