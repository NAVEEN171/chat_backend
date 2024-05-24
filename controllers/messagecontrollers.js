const express=require("express");
const router=express.Router();
const mongoose=require("mongoose");
const connection = mongoose.connection;
const { v4: uuidv4 } = require('uuid');


const db = connection.useDb("users");

const msgs = db.collection("messages");



router.post("/photos/uploads",async(req,res,next)=>{
       try{
        console.log("requesting.......")
         const {from,to,downurl}=req.body;
         console.log(from+to)
         let rname=from+to;
         let revname=to+from;
         let data;
         const select=await msgs.findOne({$or:[{name:rname},{name:revname}]})
         
         
         
         if(select ){
              data= await msgs.findOneAndUpdate(
                {name:select.name},
                {$set:{
                  backgroundimage:downurl
                }},
                {returnDocument:"after"}
                
                )
                console.log(data)
                
         }
         else{
               data=await msgs.insertOne({
                messages:[],
                    lastmessage:{},
                
                name:revname,
                users:[from,to],
                newusers:{[`${from}`]:[],[`${to}`]:[]},
                backgroundimage:downurl,
    
    
            })
            data=await msgs.findOne({name:revname})
            console.log("data is")
            console.log(data)
         }
         if(data){
            res.json({data});
         }



        
       }
       catch(err){
        console.log(err)
       }


})

router.post("/search",async(req,res,next)=>{
    try{
              const {userid,selectedid}=req.body;
              let name=userid+selectedid;
              let revname=selectedid+userid;
              const select=await msgs.findOne({name:name})
              const revselect=await msgs.findOne({name:revname})
              if(select || revselect){
                res.json({id:select?select.name:revselect.name,msg:"success",lastmessage:select?select.lastmessage:revselect.lastmessage})
              }
              else{
                res.json({msg:"fail"})
              }
            }
            catch(err){
                console.log(err);
            }
})


router.post("/addmsg",async(req,res,next)=>{
    try{
            console.log("adding msg to database");
            console.log(req.body.txt);
           const {txt,from,to}=req.body;
           
           let msgdocumentname=from+to;
           let reversedmsgdocumentname=to+from;
            console.log("from+to")
           console.log(msgdocumentname)
           console.log("to+from");
           console.log(reversedmsgdocumentname)

         const existchat= await msgs.findOne({name:msgdocumentname});
         const reversedexistchat=await msgs.findOne({name:reversedmsgdocumentname});
         if(existchat || reversedexistchat){
            const currentDateTime = new Date();


            const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
            const indianDateTime = new Date(currentDateTime.getTime() + istOffset);
            let data=await msgs.findOneAndUpdate(
                { name: existchat ? msgdocumentname : reversedmsgdocumentname },
                {   

                  $push: {
                    messages: {
                      txt,
                      sender: from,
                      reciever: to,
                      timestamps: indianDateTime,
                      send: null,
                      uid:uuidv4(),
                    }
                  },
                  $set: {
                    lastmessage: {
                      txt,
                      sender: from,
                      timestamps: indianDateTime,
                      reciever: to
                    }
                  }
                },
                {returnDocument:"after"}
              );
              if(data){
                
                console.log(data)
                for(let key in data.newusers){
                  
                  if(key!==from){
                    data.newusers[key].push({ txt,
                      sender: from,
                      timestamps: indianDateTime,
                      reciever: to})
                  }
                }
                console.log(data)
                data=await msgs.findOneAndUpdate(
                  { name: existchat ? msgdocumentname : reversedmsgdocumentname },
                   {$set:{newusers:data.newusers}},
                 )
              }
             
              
              res.json({ msg: "msg successfully uploaded", id: existchat ? msgdocumentname : reversedmsgdocumentname });
              


         }
         else{
          const currentDateTime = new Date();


          const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
          const indianDateTime = new Date(currentDateTime.getTime() + istOffset);
       await msgs.insertOne({
            messages:[{txt,sender:from,
                reciever:to,timestamps:indianDateTime,send:null,uid:uuidv4()},],
                lastmessage:{txt,sender:from,reciever:to,timestamps:indianDateTime},
            
            name:msgdocumentname,
            users:[from,to],
            newusers:{[`${from}`]:[],[`${to}`]:[{txt,sender:from,reciever:to,timestamps:indianDateTime}]},
            backgroundimage:"",


        })
        res.json({msg:"msg sucessfully uploaded",id:msgdocumentname})

    }}
    catch(err){
        console.log(err);
    }
})

router.post("/getmessages",async(req,res,next)=>{
    const {from,to}=req.body;
    let msgdocumentname=from+to;
    let reversedmsgdocumentname=to+from;
console.log("from+to")
           console.log(msgdocumentname)
           console.log("to+from");
           console.log(reversedmsgdocumentname)
           const existchat=await msgs.findOne({name:msgdocumentname})
           const revexistchat=await msgs.findOne({name:reversedmsgdocumentname});
           console.log(existchat)
           console.log(revexistchat)
           let showmsgs;
           if(existchat ){
            if(existchat.messages.length===0){
              res.json({showmsgs:null})
              return;
            }
                showmsgs={...(existchat.messages)}
               console.log(showmsgs)
               
console.log("exist perfectly")
               for (const key in showmsgs) {
                   if (showmsgs.hasOwnProperty(key)) {
                       const element = showmsgs[key];
                       console.log(`from-${from}`);
                       if (element.sender === from) {
                           element.send = true;
                       } else {
                           element.send = false;
                       }
                   }
               }
               
               console.log(showmsgs)    
               res.json({showmsgs,id:existchat.name,messages:existchat.messages,users:existchat.users,backgroundimage:existchat.backgroundimage})
           }
           else if(revexistchat){
           showmsgs={...(revexistchat.messages)}
        
           console.log("rev perfectly")

           for (const key in showmsgs) {
               if (showmsgs.hasOwnProperty(key)) {
                   const element = showmsgs[key];
                   console.log(`from-${from}`);
                   if (element.sender === from) {
                       element.send = true;
                   } else {
                       element.send = false;
                   }
               }
           }
           
           console.log(showmsgs)
            console.log(showmsgs)
            res.json({showmsgs,id:revexistchat.name,messages:revexistchat.messages,users:revexistchat.users,backgroundimage:revexistchat.backgroundimage})

           }
           else{
            res.json({showmsgs:null})
           }
})


module.exports=router;