import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import { initializeSocket } from "./socket";

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);

    server = app.listen(config.port, () => {
      console.log(`app is listening on port ${config.port}`);
    });


    initializeSocket(server);
        
    // const io = require("socket.io")(server, {
    //   pingTimeout: 60000,
    //   cors: {
    //     origin: "*",
    //     methods: ["GET", "POST"],
    //   },
    // });


    // io.on("connection", (socket: any) => {
    //   // console.log("connected to socket.io");
    //   // socket.on("setup", (userData: any) => {
    //   //   socket.join(userData._id);
    //   //   // console.log(userData._id);
    //   //   socket.emit("connected");
    //   // });
    //   // socket.on("join chat", (room: any) => {
    //   //   socket.join(room);
    //   //   // console.log("user joined room " + room);
    //   // });
    //   // socket.on("typing", (typer: any) => {
    //   //   const {room, user} = typer;
    //   //   socket.broadcast.to(room).emit("typing", typer);
    //   // });
    //   // socket.on("stop typing", (typer: any) => {
    //   //   const {room, user} = typer;
    //   //   socket.broadcast.to(room).emit("stop typing", typer);
    //   // });

    //   // socket.on("new message", (newMessageReceived: any) => {
    //   //   let chat = newMessageReceived?.data?.data;
    //   //   // console.log(chat)
    //   //   if (!chat.authorId) {
    //   //     return console.log("chat.users not defined");
    //   //   }
    //   //   // chat?.users?.forEach((user: any) => {
    //   //   //   if (user?._id === newMessageReceived.sender?._id) {
    //   //   //     return;
    //   //   //   }
    //   //   // });
    //   //   else if(chat?.authorId !== chat?.otherUser){
          
    //   //     socket
    //   //       .in(chat.otherUser)
    //   //       .emit("message received", newMessageReceived);
    //   //   }
    //   //   if (chat?.otherUserArr) {
    //   //     chat?.otherUserArr.forEach((user: any) => {
    //   //       socket.in(user?._id).emit("message received", newMessageReceived);

    //   //     });
          
    //   //   }
    //   // }
    //   // );


    //   // socket.off("setup", (userData: any) => {
    //   //   socket.leave(userData._id);
    //   // });

    // });
  } catch (err) {
    console.log(err);
  }
}

main();

process.on("unhandledRejection", (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
