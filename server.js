const express=require("express");
const cors=require("cors");
const path=require("path");
const mongoose=require("mongoose");
const http=require("http")
const userroutes=require("./controllers/usercontrollers");
const messageroutes=require("./controllers/messagecontrollers")
const app=express();
const bodyParser=require("body-parser");
require("dotenv").config();
const { Server } = require("socket.io");
const server = http.createServer(app);
const axios = require('axios');



 // Import socket.io module
const users={};
const max_inactivity_time=1000*60*2;
const makeuseronline=(req,res,next)=>{
  const userId = req.headers['x-user-id'];
  if(typeof userId!==undefined && userId!==undefined){
  
  if(users[userId]){
    users[userId].lastactivity=Date.now();
  }
  else{
   
    users[userId]={user:userId,lastactivity:Date.now()}
  }
  console.log("users after inserting");
  console.log(users);
  }
next();

}

const axiosrequest=async(key)=>{
  console.log(`key is ${key}`);
  if(typeof key===undefined){
    console.log("type")
console.log(typeof key)
    return ;
  }
  try {
    console.log("i am trying to fetch");
    const response = await axios.post(`https://chat-app-backend-4fhe.onrender.com/status/${key}`, {
        type: "offline"
    });
    console.log("result")
    console.log(response.data);
    console.log(users);
    console.log("users")
    let response2;
 /* if(response){
    console.log("response over")
     response2=await axios.post(`https://chat-app-backend-4fhe.onrender.com/changeroom/${"Empty"}`,
      {
          user:key
      }
    )
  }
  console.log("room is");
  console.log(response2.data);*/
    return response.data;
    
} catch (error) {
    console.error('Error:', error.response.data);
}
}
const makeuseroffline=()=>{
  console.log("i am running");
     Object.keys(users).forEach((key)=>{
           let value=users[key];
           console.log(value.user)
           if(value.user==='undefined'|| value.user===undefined){
                delete users[key];
                console.log("user is undefined")
                console.log(users)
           }
           if(value.lastactivity+max_inactivity_time<Date.now() && value.user!=='undefined' ){
            //make the user offline (key)
            console.log("users after checking constraints")
            console.log(users)
              axiosrequest(key);
              delete users[key];


            
           }
          }
     )
}
setInterval(makeuseroffline,max_inactivity_time);

app.use(cors());
app.use(bodyParser.json())
app.use("/uploads/images",express.static(path.join("uploads","images")));


app.use(makeuseronline)

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
serv = server.listen(5000);

mongoose.connect(process.env.MongoDBURI,{
  w: 'majority'
}
    ).then(()=>{
    console.log("connected")
    const io = require("socket.io")(serv, {
      wssEngine:['ws','wss'],
      transports:["websocket","polling"],
      pingTimeout:60000,
      cors: {
   //  origin: "https://chat-app-blush-rho.vercel.app",
     origin:["http://localhost:3000","https://chat-app-blush-rho.vercel.app","https://chat-app-backend-4fhe.onrender.com","https://chat-66i8vvsrt-naveens-projects-73ee5034.vercel.app"],
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      }
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
            socket.broadcast.emit("message recieved",{lastelement,status:true});
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
