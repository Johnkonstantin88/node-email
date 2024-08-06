const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const Jimp = require("jimp");
require("dotenv").config();

const { User } = require("../models/user");
const { HttpError, ctrlWrapper, sendEmail } = require("../helpers");

const { SECRET_KEY, BASE_URL } = process.env;
const avatarsDir = path.join(__dirname, "..", "public", "avatars");

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email already in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationToken = crypto.randomUUID();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  await sendEmail({
    to: email,
    from: "kliukovka@mail.com",
    subject: "Email verification",
    html: `<a href='${BASE_URL}/api/auth/users/verify/${verificationToken}'>Click here to verificate your email</a>`,
    text: `Please open link to verificate your email ${BASE_URL}/api/auth/users/verify/${verificationToken}`,
  });

  res.status(201).json({ email: newUser.email });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  });

  res.status(200).json({
    message: "Verification successful",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(400, "Missing required field email");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  await sendEmail({
    to: email,
    from: "kliukovka@mail.com",
    subject: "Email verification",
    html: `<a href='${BASE_URL}/api/auth/users/verify/${user.verificationToken}'>Click here to verificate your email</a>`,
    text: `Please open link to verificate your email ${BASE_URL}/api/auth/users/verify/${user.verificationToken}`,
  });

  res.status(200).json({
    message: "Verification email sent",
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Wrong email or password");
  }

  if (!user.verify) {
    throw HttpError(401, "Your email is not verified");
  }

  const comparedPassword = await bcrypt.compare(password, user.password);

  if (!comparedPassword) {
    throw HttpError(401, "Wrong email or password");
  }

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
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  loginUser: ctrlWrapper(loginUser),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logoutUser: ctrlWrapper(logoutUser),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
};
