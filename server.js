const express=require("express");
const cors=require("cors");
const path=require("path");
const mongoose=require("mongoose");
const userroutes=require("./controllers/usercontrollers");
const messageroutes=require("./controllers/messagecontrollers")
const app=express();
const bodyParser=require("body-parser");
require("dotenv").config()
 // Import socket.io module



app.use(cors());
app.use(bodyParser.json())
app.use("/uploads/images",express.static(path.join("uploads","images")));


app.use((req, res, next) => {
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

app.get("/",(req,res)=>{
  res.json("deployed succesfully")
})
app.use("/",userroutes);
app.use("/messages",messageroutes)
let serv;
let roomid;
let useridentity;
serv = app.listen(5000);

mongoose.connect(process.env.MongoDBURI
    ).then(()=>{
    console.log("connected")
    const io = require("socket.io")(serv, {
      cors: {
        origin: "http://localhost:3000",
        // credentials: true,
      },
    });
    
    io.on("connection", (socket) => {
      let uidd;
      console.log("Connected to socket.io");
        socket.on("setup",(user)=>{
          socket.join(user._id);
          useridentity=user._id;
          uidd=user._id;
          console.log(`user connected ${user._id}`)
          io.emit("connuser",user._id);
        })
        socket.on("join chat",(room)=>{
          console.log(`room:${room}`)
           socket.join(room);
          
           console.log(`joined room ${room}`)
           if(room!==null){
            roomid=room
            socket.emit("joinedchat",room)
           }
          
        })
        socket.on("disconnect",()=>{
          io.emit("disconn",uidd);
        })
        socket.on("new message",(data)=>{
          console.log("data fecthed")
           console.log(data.messages.length-1);  
           console.log("last msg");
           let lastelement=data.messages[data.messages.length-1]
           console.log(lastelement)
          
          /* if(useridentity===lastelement.sender){
               lastelement.send=true;
           }
           else{
            lastelement.send=false;
           }*/
           console.log(data.users)
           let messagee=lastelement.txt;
           if(data.users.length<=1){
              return;
           }
           data.users.forEach((user)=>{
            console.log(user);
            console.log("run");

                  if(user===lastelement.sender) return;
            socket.in(roomid).emit("message recieved",{lastelement,status:true});
           })

           console.log(data.messages.length-1)
        })
    })
  
  
  })
  .catch((err)=>{
    console.log("not ")
    console.log(err)
  })
  const connection=mongoose.connection;
