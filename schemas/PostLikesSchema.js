const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostLikeschema = new mongoose.Schema({
    post_id:
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Posts"
    },

    user_id:
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    },
    status:{
      type:Number,
      default:0
    }
   
});

const PostLikes = new mongoose.model('PostLikes',PostLikeschema);
module.exports = PostLikes;