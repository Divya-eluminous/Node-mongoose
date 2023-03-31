const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new mongoose.Schema({
    name:
    {
      type:String,
      required:true
    },
    user_id:
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }
   
},
{ 
  timestamps: false, toJSON: { virtuals: true } }
);

PostSchema.virtual("PostLikesData", {
  ref: "PostLikes",
  foreignField: "post_id",
  localField: "_id"
});



const Posts = new mongoose.model('Posts',PostSchema);
module.exports = Posts;