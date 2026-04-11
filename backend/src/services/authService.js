const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Artist = require("../models/Artist");

// Regex de email — RFC 5322 simplificado
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

exports.generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
};

exports.register = async ({ username, email, password, role, name, bandInfo }) => {

  // Validação de email
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Email inválido");
  }

  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });

  if (existing) {
    if (existing.email === email.toLowerCase()) throw new Error("Este email já está em uso");
    throw new Error("Este username já está em uso");
  }

  const userData = {
    username,
    email,
    password,
    role: role || "listener",
    name: name || "",
  };

  if ((role === "band" || role === "artist") && bandInfo) {
    userData.bandInfo = bandInfo;
  }

  const user = await User.create(userData);

  // ── Se for banda/artista, cria (ou vincula) documento na collection Artist ──
  if (role === "band" || role === "artist") {

    // Verifica se já existe um Artist com o mesmo nome (username da banda)
    let artist = await Artist.findOne({ name: username });

    if (!artist) {
      // Gera avatar automático com o nome
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7f1d1d&color=fff&bold=true`;

      // Converte genre string → array (ex: "Rock, Indie" → ["rock","indie"])
      let genreArray = [];
      if (bandInfo?.genre) {
        genreArray = bandInfo.genre
          .split(",")
          .map((g) => g.trim().toLowerCase())
          .filter(Boolean);
      }

      artist = await Artist.create({
        name: username,
        bio: bandInfo?.bio || "",
        avatar: avatarUrl,
        genre: genreArray,
        country: "BR",
        isActive: true,
        socialLinks: {
          instagram: bandInfo?.socialLinks?.instagram || "",
          youtube: bandInfo?.socialLinks?.youtube || "",
        },
      });
    }

    // Vincula o Artist ao User
    user.artistId = artist._id;
    await user.save();
  }

  const token = exports.generateToken(user);

  // Remove senha do objeto retornado
  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token };
};

exports.login = async ({ email, password }) => {

  // Validação básica de email antes de bater no banco
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Email inválido");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new Error("Email ou senha inválidos");

  if (!user.isActive) throw new Error("Conta desativada. Entre em contato com o suporte");

  const valid = await user.comparePassword(password);

  if (!valid) throw new Error("Email ou senha inválidos");

  const token = exports.generateToken(user);

  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token };
};
