const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    author: String,
    post: String,
    content: String,
    date:Number,
});
  
    

const Comment = mongoose.model("comment", commentSchema);
module.exports = Comment;