const userService = require("../services/userService");

exports.getMyProfile = async (req, res) => {
  try {

    const user = await userService.getUserById(req.user.id);

    res.json(user);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
};

exports.getUserById = async (req, res) => {
  try {

    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json(user);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
};

exports.updateProfile = async (req, res) => {
  try {

    const updated = await userService.updateUser(req.user.id, req.body);

    res.json(updated);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
};

exports.followUser = async (req, res) => {
  try {

    const follow = await userService.followUser(
      req.user.id,
      req.params.id
    );

    res.json(follow);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
};

exports.unfollowUser = async (req, res) => {
  try {

    await userService.unfollowUser(
      req.user.id,
      req.params.id
    );

    res.json({ message: "Unfollow realizado" });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
};