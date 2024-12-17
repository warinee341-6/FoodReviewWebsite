var express = require('express');
var router = express.Router();
const PosT = require("../models/postdb");
const Comment = require('../models/commentdb');
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

router.get("/compose", (req, res) => {
    if(req.session.username){
        res.render("compose", { user: req.session.username });
    }
});

router.post("/compose", upload.single("image"), async (req, res) => {
    const postData = {
      author: req.session.username,
      title: req.body.postTitle,
      content: req.body.postBody,
      thumbnail: imagename,
      date: Date.now(),
      like: 0,
    };
    await PosT.insertMany(postData);
    res.redirect("/home");
});

router.get("/:custom", async (req, res) => {
    if (req.session.username) {
      try {
        const postId = req.params.custom; 
        const comments = await Comment.find({ post: postId }).exec();
        const results = await PosT.find(); 
        res.render("posts", {
          user: req.session.username,
          posts: results,
          comments: comments,
          date: Date.now(),
          id: req.params.custom,
        });
      } catch (err) {
        console.error(err);
        res.render("error"); 
      }
    } else {
      res.render("notfound");
    }
});
  



router.post("/:custom", async (req, res) => {
    const id = req.params.custom;
    const userid = req.session.username;
    try {
      const post = await PosT.findOne({ _id: id }); 
      if (post.likedby.includes(userid)) {
        await PosT.findOneAndUpdate(
          { _id: id },
          { $pull: { likedby: userid } },
          { new: true }
        );
        console.log("ผู้ใช้ยกเลิกการถูกใจ");
  
        await PosT.findOneAndUpdate({ _id: id }, { $inc: { like: -1 } }); 
        console.log("ลดจำนวนไลก์แล้ว");
      } else {
        await PosT.findOneAndUpdate(
          { _id: id },
          { $push: { likedby: userid } },
          { new: true }
        );
        console.log("ผู้ใช้กดถูกใจแล้ว");
  
        await PosT.findOneAndUpdate({ _id: id }, { $inc: { like: 1 } }); 
      }
      res.redirect("/posts/" + req.params.custom);
    } catch (err) {
      console.error(err);
      res.render("error"); 
    }
});
  
router.get("/update/:custom", async (req, res) => {
    if (req.session.username) {
      try {
        const result = await PosT.findById(req.params.custom); 
        console.log(result);
        
        if (req.session.username === result.author || req.session.username === "admin") {
          res.render("edit-post", { user: req.session.username, post: result });
        } else {
          res.render("notfound");
        }
      } catch (err) {
        console.error(err);
        res.render("error"); 
      }
    } else {
      res.render("notfound");
    }
});
  

router.post("/update/:custom", upload.single("image"), async (req, res) => {
    try {
      await PosT.findByIdAndUpdate(req.params.custom, {
        title: req.body.postTitle,
        content: req.body.postBody,
        thumbnail: imagename,
      });
      res.redirect("/posts/" + req.params.custom);
    } catch (err) {
      console.error(err);
      res.render("error"); 
    }
});

router.get("/delete/:custom", async (req, res) => {
    if(req.session.username){
      try {
        const results = await PosT.findById(req.params.custom);
        if (
          req.session.username === results.author ||
          req.session.type === "admin"
        ) {
          await PosT.findByIdAndDelete(req.params.custom);
          console.log("deleted");
          if (req.session.username === "admin") {
            res.redirect("/admin");
          } else {
            res.redirect("/home");
          }
        } else {
          res.render("notfound");
        }
      } catch (err) {
        console.error(err);
        res.render("error");
      }
    } else {
      res.redirect("/");
    }
});


router.get("/:id/comments", async (req, res) => {
    const postId = req.params.id;
    try {
        const comments = await Comment.find({ post: postId }).exec();
        res.render('comments', { comments }); 
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "An error occurred while fetching comments." });
    }
});

router.post("/:id/comments", async (req, res) => {
    const postId = req.params.id;
    const { author, content } = req.body;
    const newComment = new Comment({
        author,
        post: postId,
        content,
        date: Date.now(),
    });
    await newComment.save();
    res.redirect("/posts/"+postId);
});


router.get("/comments/delete/:commentId", async (req, res) => {
    const commentId = req.params.commentId;
    const username = req.session.username; 

    try {
        const comment = await Comment.findById(commentId); 
        if (comment.author === username) {
            await Comment.findByIdAndDelete(commentId); 
            console.log("Comment deleted");
            res.redirect("/posts/" + comment.post); 
        } else {
            console.log("Unauthorized attempt to delete comment");
            res.status(404).send("You are not authorized to delete this comment.");
        }
    } catch (err) {
        console.error(err);
        res.render("error"); 
    }
});

module.exports = router;
