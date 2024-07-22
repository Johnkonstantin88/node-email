const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("node:path");
const fs = require("node:fs/promises");
const Jimp = require("jimp");
require("dotenv").config();

const { User } = require("../models/user");
const { HttpError, ctrlWrapper } = require("../helpers");

const avatarsDir = path.join(__dirname, "..", "public", "avatars");

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email already in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
  });

  res.status(201).json({ email: newUser.email });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Wrong email or password");
  }

  const comparedPassword = await bcrypt.compare(password, user.password);

  if (!comparedPassword) {
    throw HttpError(401, "Wrong email or password");
  }

  const { SECRET_KEY } = process.env;
  const payload = { id: user._id };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: {
      email,
      subscription: user.subscription,
    },
  });
};

const getCurrentUser = (req, res) => {
  const { email, subscription } = req.user;

  res.json({ email, subscription });
};

const logoutUser = async (req, res) => {
  const { _id } = req.user;

  await User.findByIdAndUpdate(_id, { token: null });

  res.json({ message: "Logged out" });
};

const updateSubscription = async (req, res) => {
  const { subscription: newSubscription } = req.body;
  const { _id, subscription } = req.user;
  if (subscription === newSubscription) {
    throw HttpError(400, "You already have this subscription");
  }
  await User.findByIdAndUpdate(
    _id,
    {
      subscription: newSubscription,
    },
    { new: true }
  );

  res.json({
    message: `subscription changed on ${newSubscription}`,
  });
};

const updateAvatar = async (req, res) => {
  if (!req.file) {
    throw HttpError(400, "You need to choose avatar");
  }

  const { _id } = req.user;
  const { path: tempDir, filename } = req.file;

  await Jimp.read(tempDir)
    .then((avatar) => {
      return avatar.resize(250, Jimp.AUTO).write(tempDir);
    })
    .catch((err) => {
      throw err;
    });

  const resultDir = path.join(avatarsDir, filename);

  await fs.rename(tempDir, resultDir);

  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({
    avatarURL,
  });
};

module.exports = {
  registerUser: ctrlWrapper(registerUser),
  loginUser: ctrlWrapper(loginUser),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logoutUser: ctrlWrapper(logoutUser),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
};
