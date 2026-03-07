const Artist = require("../models/Artist");

// ✅ Usa o model Artist (collection "artists") — onde os dados reais estão
// Quando artistas criarem conta como usuário, o campo "owner" em ArtistProfile
// vai vincular o User ao Artist existente

exports.createArtistProfile = async (userId, data) => {

  const artist = await Artist.create({
    ...data,
    // guarda referência ao usuário dono, se o campo existir no model
    ...(userId && { owner: userId })
  });

  return artist;

};

exports.getArtistById = async (id) => {

  return Artist.findById(id).lean();

};

exports.getAllArtists = async () => {

  return Artist.find({ isActive: true })
    .sort({ monthlyListeners: -1 })
    .lean();

};