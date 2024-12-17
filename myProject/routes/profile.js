var express = require('express');
var router = express.Router();
const PosT = require("../models/postdb");
var Profile = require('../models/profiledb');
const sessions = require("express-session");

let imagename;
const multer = require("multer");
const { send, title } = require("process");
const { profile } = require("console");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/thumbnails");
  },
  filename: (req, file, cb) => {
    // console.log(file);

    cb(null, file.originalname);
    imagename = file.originalname;
  },
});
const upload = multer({ storage: storage });
let user;

router.use(express.urlencoded({ extended: false }));
router.use(
  sessions({
    secret: "secret key",
    saveUninitialized: true,
    resave: false,
  })
);


router.get("/:customRoute", async (req, res) => {
  if (req.session.username) {
    const customRoute = req.params.customRoute;

    try {
      const userPosts = await PosT.find({ author: customRoute });
      req.session.userposts = userPosts;
      const profileData = await Profile.findOne({ username: customRoute });
      res.render("profile", {
        username: req.session.username,
        type: req.session.type,
        posts: req.session.userposts,
        userdata: profileData,
        date: Date.now(),
      });

    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
});
  

router.get("/editprofile/:custom", async (req, res) => {
  if (req.session.username) {
    try {
      const result = await Profile.findOne({ username: req.params.custom });
      if (req.session.username === result.username) {
        const profileData = await Profile.findOne({ username: req.session.username });
        res.render("edit-profile", { username: req.session.username, email: req.session.useremail, userdata: profileData});
      } else {
        res.render("notfound");
      }
    } catch (err) {
      console.error(err);
      res.render("notfound");
    }
  } else {
    res.redirect("/");
  }
});

router.post("/editprofile/:custom", upload.single("image"), async (req, res) => {
  const custom = req.params.custom;

  try {
    await Profile.findOneAndUpdate(
      { username: req.session.username },
      {
        fullname: req.body.fullname,
        email: req.session.useremail,
        dp: imagename,
        bio: req.body.bio,
        facebook: req.body.fb,
        twitter: req.body.tw,
        instagram: req.body.insta,
      }
    );
    res.redirect("/profile/" + custom);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating profile");
  }
});

router.get("/edituser/:id", async (req, res) => {
  if (req.session.type === "admin") {
    try {
      const userProfile = await Profile.findById(req.params.id); 
      if (userProfile) {
        res.render("edit-user", { userdata: userProfile, type: userProfile.type }); 
      } else {
        res.status(404).render("notfound");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving user data");
    }
  } else {
    res.render("notfound");
  }
});


router.post("/edituser/:id", upload.single("image"), async (req, res) => {
  if (req.session.type === "admin") {
    try {
      const updatedFields = {
        fullname: req.body.fullname,
        email: req.body.email,
        bio: req.body.bio,
        type: req.body.type,
        dp: imagename,
        facebook: req.body.fb,
        twitter: req.body.tw,
        instagram: req.body.insta,
      };

      await Profile.findByIdAndUpdate(req.params.id, updatedFields); 
      res.redirect("/admin"); 
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating user");
    }
  } else {
    res.render("notfound");
  }
});

router.get("/removeuser/:custom", async (req, res) => {
  if (req.session.type === "admin") {
    try {
      await Profile.findByIdAndDelete(req.params.custom);
      await PosT.deleteMany({ author: { $eq: req.query.user } });
      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting user or their posts");
    }
  } else {
    res.render("notfound");
  }
});

router.post("/searchUser",async(req,res)=>{
  let payload=req.body.payload.trim()
  // console.log(payload);
  let search=await Profile.find({username:{$regex: new RegExp('^'+payload+'.*','i')}}).exec();
  search = search.slice(0,10)
  // console.log(search);
  res.send({payload:search})

});


module.exports = router;
