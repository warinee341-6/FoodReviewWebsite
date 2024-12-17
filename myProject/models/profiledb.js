const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  username: String,
  fullname: String,
  email: String,
  password:String,
  type:String,
  dp: String,
  bio: String,
  facebook:String,
  twitter:String,
  instagram:String,
});

const Profile = mongoose.model("profile", profileSchema);

module.exports = Profile;
