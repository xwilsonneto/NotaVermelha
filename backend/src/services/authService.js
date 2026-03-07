const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.generateToken = (user)=>{

return jwt.sign(
{ id:user._id, role:user.role },
process.env.JWT_SECRET,
{ expiresIn:"15d" }
);

};

exports.register = async ({ username, email, password, role, bandInfo }) => {

const existing = await User.findOne({ $or: [{ email }, { username }] });

if(existing){
if(existing.email === email.toLowerCase()) throw new Error("Este email já está em uso");
throw new Error("Este username já está em uso");
}

const userData = { username, email, password, role: role || "listener" };

if((role === "band" || role === "artist") && bandInfo){
userData.bandInfo = bandInfo;
}

const user = await User.create(userData);
const token = exports.generateToken(user);

return { user, token };

};

exports.login = async ({ email, password }) => {

const user = await User.findOne({ email }).select("+password");

if(!user) throw new Error("Email ou senha inválidos");

if(!user.isActive) throw new Error("Conta desativada. Entre em contato com o suporte");

const valid = await user.comparePassword(password);

if(!valid) throw new Error("Email ou senha inválidos");

const token = exports.generateToken(user);

// Remove senha do objeto retornado
const userObj = user.toObject();
delete userObj.password;

return { user: userObj, token };

};