const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var validate = require('mongoose-validator')

var nameValidator=[
  validate({
    validator:'isLength',
    arguments:[3,15],
    message:'Name should be between {ARGS[0]} and {ARGS[1]} characters'
  })
]

const validateEmail = function(email) {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

const UserSchema = new mongoose.Schema({
    name:
    {
      type:String,
      required:[true,'Name is required'],
      validate: nameValidator
    },
    email:
    {
      type:String,
      required:[true,'Email is required'],
      unique:true,
      validate:[validateEmail,'Please enter valid email']
    },
    age:{
      type:Number,
      required:[true,'Age is required'],
      validate:{
        validator:function(arr){
          return arr > 18;  
        },
        message: "You must provide age more than 18."
      }
    },
    status:{
      type:Number,
      default:0
    },
    profile_photo:{
      type:String,
      required:true
    },
    profile_photo_path:{
      type:String,
      required:true
    }       
},
{ timestamps: false, toJSON: { virtuals: true } }

);

UserSchema.virtual("posts", {
  ref: "Posts",
  foreignField: "user_id",
  localField: "_id", 
  //count: true // And only get the number of posts count in relation
});

const User = new mongoose.model('User',UserSchema);
module.exports = User;