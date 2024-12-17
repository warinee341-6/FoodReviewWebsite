var express = require('express');
var router = express.Router();
var sessions = require("express-session");
const PosT = require("../models/postdb");
const Profile = require("../models/profiledb");


let imagename
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


router.get("/home", async (req, res) => {
  if (req.session.useremail) {
    try {
      const posts = await PosT.find().exec();
      const sortedPosts = await PosT.find().sort({ like: "desc" }).exec();

      res.render("home", {
        user: req.session.username,
        posts: posts,
        date: Date.now(),
        sposts: sortedPosts,
      });
    } catch (err) {
      console.log(err);
      res.render("error", { error: "Error fetching posts" });
    }
  } else {
    res.redirect("/");
  }
});


router.post("/search",async(req,res)=>{
  let payload=req.body.payload.trim()
  let search=await PosT.find({title:{$regex: new RegExp('^'+payload+'.*','i')}}).exec();
  search = search.slice(0,10)
  res.send({payload:search})
});


router.get("/", (req, res) => {
  res.render("login");
});

router.get("/logout", (req, res) => {
  req.session.destroy(); 
  imagename=null
  res.redirect("/");
});

router.get("/signup",(req,res)=>{
  res.redirect("/")
})

router.post("/signup", async (req, res) => {

  const userExists = await Profile.exists({ username:req.body.name });
  if(!userExists){
  const profileData = {
    username: req.body.name,
    email: req.body.email,
    password: req.body.password,
    type: "user",
    fullname:req.body.name,
    dp: "",
    bio: "",
    facebook: "",
    twitter: "",
    instagram: "",
  };

  await Profile.insertMany(profileData)
  req.session.useremail = req.body.email;
  req.session.username = req.body.name;
  res.redirect("home");
}else{
  res.send("<script>alert('user already exits');window.location.href = '/'</script>");

}
});

router.get("/admin", async (req, res) => {
  if (req.session.useremail && req.session.type === "admin") {
    try {
      const posts = await PosT.find().exec();         
      const profiles = await Profile.find().exec();    

      res.render("admin", { posts: posts, profiles: profiles });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      res.render("error", { error: "Error fetching admin data" });
    }
  } else {

    res.redirect("/home");
  }
});


router.post("/login", async (req, res) => {
  try {
    const check = await Profile.findOne({ email: req.body.email });

    if (!check) {
      return res.send("<script>alert('ไม่พบผู้ใช้');window.location.href = '/'</script>");
    }

    if (check.password === req.body.password) {
      req.session.useremail = check.email;
      req.session.username = check.username;
      req.session.type = check.type;

      if (check.type === "admin") {
        res.redirect("/admin");
      } else {
        res.redirect("/home");
      }
    } else {
      res.send("<script>alert('รหัสผ่านไม่ถูกต้อง');window.location.href = '/'</script>");
    }
  } catch (error) {
    console.error(error); // บันทึกข้อผิดพลาดสำหรับการดีบัก
    res.send("<script>alert('เกิดข้อผิดพลาดในขณะเข้าสู่ระบบ');window.location.href = '/'</script>");
  }
});


module.exports = router;
