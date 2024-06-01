const express=require("express");
const router=express.Router();
const { ObjectId } = require('mongoose').Types;
const fileupload=require("./upload")
const fs=require("fs");

const bcrypt=require("bcrypt");
const mongoose=require("mongoose");

const connection = mongoose.connection;

const db = connection.useDb("users");

const users = db.collection("user");



router.post("/changeroom/:id",async(req,res,next)=>{
    let room=req.params.id;
    const {user}=req.body;
let exisitinguser;
    
    try{
        if(room && room!=="Empty"){
         //console.log("changedroom")
         //console.log(user)
         //console.log(room);
          exisitinguser=await users.findOneAndUpdate({_id:new ObjectId(user)},
         {$set:{currentroom:room}},
               {returnDocument:"after"}
    
        )
    }
    else{
        //console.log("emptyroom")
        exisitinguser=await users.findOneAndUpdate({_id:new ObjectId(user)},
        {$set:{currentroom:""}},
              {returnDocument:"after"}
   
       )

    }
        if(exisitinguser){
            res.json(exisitinguser);
        }
    }
    catch(err){
console.log(err)
    }
})


router.post("/changename/:id",async(req,res,next)=>{
    let uid=req.params.id;
    //console.log("requested")
    //console.log(uid)
    try{
         const {name}=req.body;
         //console.log(name)
         let exisitinguser=await users.findOneAndUpdate({_id:new ObjectId(uid)},{
            $set:{username:name},
            
         },
         {returnDocument:"after"}
          );
         if(exisitinguser){
            res.json({exisitinguser});
         }

    }
    catch(err){
        console.log(err)
    }
})


router.post("/status/:id",async (req,res,next)=>{
    let uid=req.params.id;
    const {type}=req.body;
    //console.log("details");
    //console.log(type);
    //console.log(uid);
    try{
        let result;
        const existinguser=await users.findOne({_id:new ObjectId(uid)});
        //console.log(existinguser)
        if(type==="online" && existinguser.isactive===false){
            //console.log("run me")
      
      if(existinguser){
         result=await users.findOneAndUpdate({_id:new ObjectId(uid)},
        {$set:{isactive:true}},
        
            {returnDocument:"after"}
        )
      }
    }
    else if(type==="offline"){
        if(existinguser && existinguser.isactive===true){
            result=await users.findOneAndUpdate({_id:new ObjectId(uid)},
           {$set:{isactive:false}},
           
               {returnDocument:"after"}
           )
         }
    }
    if(result){
        res.json({result,type})
    }
    }
    catch(err){
console.log(err);
    }
})

//for adding properties for each documents in a collection
router.get("/useraddproperty",async(req,res,next)=>{
    try{
          let documents=await users.find({}).toArray();
          let a=0;
          if(documents){  
            documents.forEach((document)=>{
              document["currentroom"]=""
                 
            
             }) ;
             //console.log(documents);
            await users.deleteMany({}); 
            await users.insertMany(documents); 
  
            
                 res.json({documents}) 
          }
    }
    catch(err){
      res.json(err);
      
    }
})  


router.post("/Signup",async (req,res,next)=>{
    //console.log("in function");
    try{
       const {username,email,password}=req.body;
       const existinguser=await users.findOne({email});
       if(existinguser){
        return res.json({msg:"email already exists",status:400})
       } 
       
       const hashedpassword=await bcrypt.hash(password,10);
       const user= await users.insertOne({
        username,
        email,
        password:hashedpassword,
        setavatar:false,
        avatarimage:"",
        lastmessage:null,
        isactive:false,
       })
       const insertedData={
        username,
        email,
        _id: user.insertedId,
        setavatar:false,
        avatarimage:"",
        lastmessage:null,
        isactive:false,


       }
       //console.log("insert")
       //console.log(insertedData);
       //console.log(user);
       delete user.password;
       return res.json({user:insertedData,status:200},
        )
    }
    catch(err){
  next(err);
    }

});


router.post("/Login",async (req,res,next)=>{
    try{
    
    const {email,password}=req.body;
    //console.log(email,password)
    const existinguser=await users.findOne({email});
 
 if(!existinguser){
    return res.json({msg:"email is not registered",status:400})
}
   
    const passwordvalidity= await bcrypt.compare(password,existinguser.password);
    
    //console.log(passwordvalidity)
   
    if(existinguser && !passwordvalidity){
        
        return res.json({msg:"invalid credentials",status:400})
    }
    if(existinguser && passwordvalidity){
        //console.log(existinguser)
               return res.json({user:existinguser,status:200})
    }}
    catch(err){
        next(err)
    }
})
router.get("/getallusers/:id",async (req,res,next)=>{
    try{
        const userid=req.params.id;
        //console.log(userid)
     let allusers=await users.find({_id:{$ne:new ObjectId(userid)}},{username:1,setavatar:1,avatarimage:1,email:0,password:0})
     allusers= await allusers.toArray();
     //console.log(allusers)
    res.json({users:allusers,staus:200})
    }
    catch(err){
        console.log(err);
    }
})
router.get("/getuser/:id",async (req,res,next)=>{
    try{
        const userid=req.params.id;
        //console.log(userid);
        //console.log("getting user....")
        const exisitinguser=await users.findOne({_id:new ObjectId(userid)});
        //console.log(exisitinguser);

    
          const changeduser={
            avatarimage:exisitinguser.avatarimage,
            setavatar:exisitinguser.setavatar,
            username:exisitinguser.username,
            email:exisitinguser.email,
            _id:userid,
            isactive:exisitinguser.isactive,
            
          }

        
        res.json({user:changeduser,status:400});

    }
    catch(err){
        //console.log("error happens here")

        console.log(err);
    }
})

router.post("/Setavatar/:id",async (req,res,next)=>{
    try{ 
        const Userid=req.params.id;
        const exisitinguser=await users.findOne({_id:new ObjectId(Userid)});
        if(exisitinguser){
    
        
            if(exisitinguser.avatarimage.startsWith("uploads")){
                   fs.unlink(exisitinguser.avatarimage,(err)=>{
                    console.log(err);
                   })       
            }
        }    
     
     //console.log(Userid)
     const avatarImage=req.body.image;
     const user=await users.findOneAndUpdate(
        {_id:new ObjectId(Userid)},
        {$set:{setavatar:true,avatarimage:avatarImage}},
        {returnDocument:"after"}
        
     )
     return res.json({
        setavatar:user.setavatar,
        avatarimage:user.avatarimage,

     })
    }
    catch(err){
        next(err);
    }
})
router.delete("/delete/:id",async(req,res,next)=>{
    const uid=req.params.id;

    //console.log("deletion process")
    //console.log(uid)
    let deleted;
    try{
    const existinguser=await users.findOne({_id:new ObjectId(uid)});
    //console.log(existinguser)

    if(existinguser){
         deleted=await users.deleteOne({_id:new ObjectId(uid)});
        //console.log("deletion happened");
        
    }
    if(deleted){
        res.json({msg:"success"})
    }
    else{
        res.json({msg:"failure"})
    }
    }
    catch(err){
        console.log(err);
    }
    
}
)
router.post("/Setavatarfile/:id",fileupload.single('image'),async (req,res,next)=>{
    const userid=await req.params.id;
    const exisitinguser=await users.findOne({_id:new ObjectId(userid)});
    if(exisitinguser){

    
        if(exisitinguser.avatarimage.startsWith("uploads")){
               fs.unlink(exisitinguser.avatarimage,(err)=>{
                console.log(err);
               })       
        }
    }
    //console.log("requested")
    //console.log(req.body);
    //console.log(req.file);
    const userimage={
        filename:req.file.filename,
        path:req.file.path,
    }
    //console.log(userimage);
    try{
        const exisitinguser=await users.findOne({_id:new ObjectId(userid)});
        if(exisitinguser){
    
        
            if(exisitinguser.avatarimage.startsWith("uploads")){
                   fs.unlink(exisitinguser.avatarimage,(err)=>{
                    console.log(err);
                   })       
            }
        }
        if(!exisitinguser){
            res.json({msg:"user doesnt exist",status:500});

        }
        const existinguser=await users.findOneAndUpdate({_id:new ObjectId(userid)},
        {$set:{setavatar:true,avatarimage:req.file.path}},
        {returnDocument:"after"}
        
        );
        //console.log(existinguser)
        res.json({details:exisitinguser,status:200});
       
    }
    catch(err){
        console.log(err)
    }

})



module.exports=router;