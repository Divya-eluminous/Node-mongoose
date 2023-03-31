const express = require('express');
const bodyParser = require('body-parser');
const multer= require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter  = require('csv-writer').createObjectCsvWriter;
var cors = require('cors')


const app = express();
const db = require('./mongoose');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors())
app.use('/uploads',express.static('uploads'));


const User = require('./schemas/UserSchema');
const Post = require('./schemas/PostSchema');
const PostLikes = require('./schemas/PostLikesSchema');


const DIR_PHOTO = "./uploads/profile_photo/";
let storage_profile_photo = multer.diskStorage({
destination: (req, file, cb) => {
    cb(null, DIR_PHOTO);
},
filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
},
}); 
let upload_profile_photo = multer({
storage: storage_profile_photo,
fileFilter(req,file,cb){
    if(!file.originalname.match(/\.(jpg|png|gif|bmp|jpeg)$/)){
        return cb(new Error('Please select image with jpg,png,gif,jpeg or bmp format'));
    }
    cb(undefined,true);
}
});

app.post('/create-user',upload_profile_photo.single('profile_phto'),(req,res)=>{
    const name = req.body.name;
    const email = req.body.email;
    const status = req.body.status;
    //console.log(req.file);
    const user = new User({
        name:name,
        email:email,
        age:req.body.age,
        status:status,
        profile_photo:req.file.filename,
        profile_photo_path:req.file.destination.replace('.','')+req.file.filename,
    });    
    user.save().then((data)=>{  
       // console.log(data);
        if(data)
        {
            return res.send({
                message:'User saved successfully.',
                error:null,
                data:data
               });
        }else{
            return res.send({
                message:'User not created.',
                error:null,
                data:null
            });
        }
       
    }).catch((error)=>{
        if (error.code === 11000) {
            return res.send({
                message:'User not created.',
                error:'email must be unique',
                data:null
            });
        }else
        {
            return res.send({
                message:'User not created.',
                error:error.message,
                data:null
            });  
        } 
       
    });
});//create-user

app.post('/get-user-list1',(req,res)=>{

    const userList = User.find({
        "$and":[
            {
                name:{$regex:`${req.body.name}`,$options: 'i'}
            },
            {
                email:{$regex:`${req.body.email}`,$options: 'i'}
            }
        ]       
    }).populate('Posts').then((data)=>{  
       // console.log(data);
        return res.send({
         message:'Users found successfully.',
         error:null,
         data:data
        });
     }).catch((error)=>{
         console.log(error.message);
         return res.send({
             message:'Users not found.',
             error:error.message,
             data:null
         });
     });
});//user-list

app.get('/get-user-details',(req,res)=>{
    const userList = User.findOne({name:"divs"}).then((data)=>{  
        console.log('User details found successfully.');
        return res.send({
         message:'User details found successfully.',
         error:null,
         data:data
        });
     }).catch((error)=>{
         console.log(error.message);
         return res.send({
             message:'User details not found.',
             error:error.message,
             data:null
         });
     });
});//get-user-details

app.delete('/delete-user',(req,res)=>{
    const userEmail = req.body.email;
    const deleteUser = User.deleteOne({email:userEmail}).then((result)=>{
       if(result.deletedCount==1){
          res.send({
            message:'User deleted successfully.',
            error:null,
            data:null
        });
       }else
       {
          res.send({
            message:'User not deleted.',
            error:'Unable to delete the user.',
            data:null
        });
       }
    }).catch((error)=>{
         res.send({
            message:'User not deleted.',
            error:error.message,
            data:null
        });
    });
});


app.post('/update-user',(req,res)=>{
    console.log('in update function');

    const updateUser = User.updateOne(
        {
            email:req.body.email
        },
        {
            $set:{name:req.body.name}
        }
    ).then((result)=>{
        console.log(result);
        if(result.modifiedCount==1)
        {
            res.send({
                message:'User updated successfully.',
                error:null,
                data:null
            });
        }
        else{
            res.send({
                message:'Unable to update the user.',
                error:null,
                data:null
            });
        }       
    }).catch((error)=>{
        res.send({
            message:'Unable to update the user.',
            error:error.message,
            data:null
        });
    });

});//update-user

app.post('/create-post',(req,res)=>{
    var name = req.body.name;
    var user_id=req.body.user_id;
    console.log(name);
    const post=new Post({
      name:name,
      user_id:user_id
    });
    post.save().then((result)=>{
      //  console.log(result);
        return res.send({
            message:'Post saved successfully.',
            error:null,
            data:null
           });
    }).catch((error)=>{
        console.log(error.message);
        return res.send({
            message:'Post not created.',
            error:error.message
        });
    })

});//create-post

app.post('/get-post-list',(req,res)=>{

    const pageNumber = req.body.pageNumber; // page number to retrieve
    const limit = req.body.limit; // number of results to retrieve per page
    var totalCount=0;
    var totalPages=0;
    Post.countDocuments({})
    .then((count) => {
        console.log(`There are ${count} documents in the model.`);
        totalCount = `${count}`;
    })
    .catch((err) => {
        console.error(err);
    });

    const postList = Post.find({
        "$and":[
            {
                name:{$regex:`${req.body.name}`,$options: 'i'}
            }           
        ]       
    })
    .skip((pageNumber - 1) * limit) // number of records to skip
    .limit(limit) // number of records to retrieve
    .select('_id name')
   // .populate('user_id','_id name email')
    .populate([
        {
            path:'user_id',
            model:'User',
            populate:[
                {
                 path:'posts',
                 model:'User',
                 populate:[
                    {
                        path:'PostLikesData',
                        model:'Posts'
                    }
                 ]
                }
            ]          
        }
    ])
    .sort({"name":"desc"})
    .then((data)=>{  
       // console.log(data);
        if(data.length>0){
            console.log(totalCount);
            totalPages = Math.ceil(totalCount/limit);                        
            return res.send({
             message:'Post found successfully.',
             error:null,
             data:data,
             count:totalCount,
             totalPages:totalPages
            });
        }else{
            return res.send({
                message:'Post not found.',
                error:null,
                data:null,
                count:0,
                totalPages:0
            });
        }
       
     }).catch((error)=>{
         console.log(error.message);
         return res.send({
             message:'Post not found.',
             error:error.message,
             data:null
         });
     });
});//post-list

app.post('/get-user-list',(req,res)=>{

    const pageNumber = req.body.pageNumber; // page number to retrieve
    const limit = req.body.limit; // number of results to retrieve per page
    var totalCount=0;
    var totalPages=0;
    User.countDocuments({status:1})
    .then((count) => {
        console.log(`There are ${count} documents in the model.`);
        totalCount = `${count}`;
    })
    .catch((err) => {
        console.error(err);
    });

    console.log(totalCount);
    const userList = User.find({
        "$and":[
            {
                name:{$regex:`${req.body.name}`,$options: 'i'}
            },
            {
                email:{$regex:`${req.body.email}`,$options: 'i'}
            },
            {
                status:1
            }
        ]       
    })
    .select('_id name email')
    .sort({name: "asc"})
    .skip((pageNumber-1)*limit)
    .limit(limit)
    // .populate('posts','_id name user_id')
    .populate([
        {
           path:'posts',
           model:'Posts',
           populate: [
            {
              path: 'PostLikesData',
              model: 'PostLikes'
            }
          ]
        }
    ])
    .then((data)=>{  
        // console.log(data);
        if(data.length>0)
        {   
            console.log(totalCount);
            totalPages = Math.ceil(totalCount/limit);
            return res.send({
                message:'Users found successfully.',
                error:null,
                data:data,
                count:totalCount,
                totalPages:totalPages
               });
        }else{
            return res.send({
                message:'Users not found.',
                error:null,
                data:null,
                count:0,
                totalPages:totalPages
            });
        }
        
      }).catch((error)=>{
          console.log(error.message);
          return res.send({
              message:'Users not found.',
              error:error.message,
              data:null
          });
      });
});//user-list

app.post('/post-like',(req,res)=>{
    
    var user_id=req.body.user_id;
    var post_id=req.body.post_id;
    var status=req.body.status;
    const postlike=new PostLikes({
      user_id:user_id,
      post_id:post_id,
      status:status
    });
    var postLiked = '';
    if(status==1){
        postLiked = 'liked';
    }else if(status==0){
        postLiked = 'disliked';
    }
    postlike.save().then((result)=>{
      //  console.log(result);
        return res.send({
            message:'Post liked successfully.',
            error:null,
            data:null
           });
    }).catch((error)=>{
        console.log(error.message);
        return res.send({
            message:'Unable to update the status.',
            error:error.message
        });
    })

});//post-like


app.post('/import-csv',(req,res)=>{
        var file = req.files;
    // Parse the CSV file and create documents based on the parsed data
        fs.createReadStream('/path/to/myfile.csv')
        .pipe(csv())
        .on('data', (row) => {
        // Create a new document based on the parsed data
        const doc = new MyModel({
            name: row.name,
            age: row.age,
            email: row.email
        });

        // Save the document to the database
        doc.save((err) => {
            if (err) {
            console.error(err);
            }
        });
        })
        .on('end', () => {
        console.log('CSV file successfully imported');
        });

});//import-csv

app.get('/export-csv',(req,res)=>{
     const csvWriter = createCsvWriter({
        path: './uploads/csv/exported.csv',
        header: [
          {id: '_id', title: 'ID'},
          {id: 'name', title: 'Name'},
          {id: 'age', title: 'Age'},
          {id:'email',title:'Email'},
          {id:'status',title:'Status'}
        ]
      });

      User.find({}).then((data)=>{ 
        console.log(data);
        var newData = arr = [];

        for(var i=0;i<data.length;i++)
        {
            // var userStatus='';
            if(data[i]['status']=='0')
            {
              userStatus='Pending';
            }
            else if(data[i]['status']=='1')
            {
              userStatus='Active';
            }
            
            newData['id'] = data[i]['_id'];
            newData['name'] = data[i]['name'];
            newData['age'] = data[i]['age'];     
            newData['email'] = data[i]['email'];     
            newData['status'] = userStatus; 
            arr.push(newData);
            newData = [];
            
        }
        //console.log(arr);
          csvWriter.writeRecords(arr)
          .then(() => {
             console.log('The CSV file was written successfully');
             res.send({
                message:'csv file exported successfully.',
                data:'./uploads/csv/exported.csv'
            });

          }).catch((error) => console.error(error));
      }).catch((error)=>{
        console.error(error);   
      });
});

app.get('/download-csv', function(req, res) {
    const imagePath = './uploads/csv/exported.csv';
    res.download(imagePath); // This will download the file
});
  
app.get('/download-image/:imagename', function(req, res) {
    var imagepath = req.params.imagename;
    const imagePath = './uploads/profile_photo/'+imagepath;
    //console.log(imagePath);
    res.download(imagePath); // This will download the file
  });

app.listen('4000',console.log('server running on port 4000'));