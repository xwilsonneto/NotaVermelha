const User = require("../models/User");
const authService = require("../services/authService");

exports.register = async(req,res)=>{

try{

const { username, email, password, role, bandInfo } = req.body;

if(!username || !email || !password){
return res.status(400).json({ error:"username, email e senha são obrigatórios" });
}

if(password.length < 6){
return res.status(400).json({ error:"Senha deve ter no mínimo 6 caracteres" });
}

const { user, token } = await authService.register({ username, email, password, role, bandInfo });

res.status(201).json({ success:true, data:{ user, token } });

}catch(err){

res.status(400).json({ error:err.message });

}

};

exports.login = async(req,res)=>{

try{

const { email, password } = req.body;

if(!email || !password){
return res.status(400).json({ error:"Email e senha são obrigatórios" });
}

const { user, token } = await authService.login({ email, password });

res.json({ success:true, data:{ user, token } });

}catch(err){

res.status(401).json({ error:err.message });

}

};