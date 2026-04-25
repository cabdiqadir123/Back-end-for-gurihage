const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2
const http = require('http');
const { Server } = require('socket.io');
const mysqlconnection = require('./dstsbase/database.js');

// ------------------- APP INIT -------------------
const app = express();
app.use(cors());
app.set('port', process.env.PORT || 5000);
app.use(express.json());

// ------------------- ROUTES -------------------
app.use('/api/user/', require('./Router/UserRouter'));
app.use('/api/Complaint/', require('./Router/ComplaintRouter'));
// app.use('/api/notification/', require('./Router/NotificationRouter'));
app.use('/api/booking/', require('./Router/BookingRouter'));
// app.use('/api/send/', require('./Router/SendRouter'));
app.use('/api/favour/', require('./Router/FavRouter'));
// app.use('/api/evc-pay/', require('./Router/EvcRouter'));
// app.use('/api/contact/', require('./Router/ContactRouter'));
// app.use('/api/account_delete/', require('./Router/AccountDeleteRouter'));
app.use('/api/chat/', require('./Router/ChatRouter'));
app.use('/api/amenity/', require('./Router/AmenitiesRouter.js'));
app.use('/api/property/', require('./Router/PropertyRouter.js'));
app.use('/api/region/', require('./Router/RegionRouter.js'));
app.use('/api/district/', require('./Router/DistrictRouter.js'));
app.use('/api/property_rules/', require('./Router/PropertyRulesRouter.js'));
app.use('/api/document/', require('./Router/DocumentRouter.js'));
app.use('/api/favour/', require('./Router/FavRouter.js'));
app.use('/api/rented/', require('./Router/RentedRouter.js'));
app.use('/api/complaint/', require('./Router/ComplaintRouter.js'));
app.use('/api/maintenance/', require('./Router/MaintenanceRouter.js'));
app.use('/api/payment/', require('./Router/PaymentRouter.js'));
app.use('/uploads', express.static('uploads'));
app.use('/api/agora/', require('./Router/CallRouter.js'));
app.use('/api/property_images/', require('./Router/PropertyImagesRouter.js'));

// ------------------- HEARTBEAT -------------------
// const APP_URL = `http://192.168.220.1:${app.get('port')}`;
// const APP_URL = process.env.APP_URL;
// const MAIN_ROUTE = '/api/user/';

function isSomaliaActiveTime() {
  const now = new Date();
  const somaliaHour = (now.getUTCHours() + 3) % 24;
  return somaliaHour >= 5 && somaliaHour <= 22;
}

// async function pingMainRoute() {
//   if (!APP_URL) return;
//   if (!isSomaliaActiveTime()) return;

//   try {
//     const res = await fetch(APP_URL + MAIN_ROUTE);
//     console.log(`Pinged ${MAIN_ROUTE} â†’ Status: ${res.status}`);
//   } catch (err) {
//     console.error(`Ping failed:`, err.message);
//   }
// }

// setInterval(pingMainRoute, 14 * 60 * 1000);
// pingMainRoute();

// ------------------- SOCKET IO CONFIG -------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store online users
const onlineUsers = new Map();
global.io = io;                // make accessible globally
global.onlineUsers = onlineUsers;

// ------------------- SOCKET EVENTS -------------------

io.on("connection", (socket) => {
  console.log("ðŸŸ¢ User connected:", socket.id);

  // REGISTER USER
  socket.on("join", (user_id) => {
    onlineUsers.set(user_id, socket.id);
    console.log(`ðŸ‘¤ User ${user_id} registered with socket ${socket.id}`);
  });

  // ----------------------------------------------------
  // ðŸ”¥ CHAT SYSTEM
  // ----------------------------------------------------
  socket.on("send_message", (data) => {
    let { sender_id, receiver_id, message, type, file_url, duration, client_temp_id } = data;

    // ? FIX HERE
    message = message ?? "";      // if null/undefined ? ""
    file_url = file_url ?? "";    // optional (if column NOT NULL)
    duration = duration ?? "";    // optional (if column NOT NULL)

    mysqlconnection.query(
      `INSERT INTO messages 
    (sender_id, receiver_id, message, type, file_url, duration, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [sender_id, receiver_id, message, type, file_url, duration],
      (error, result) => {
        if (error) return console.error("DB error:", error);

        const newMessage = {
          id: result.insertId,
          sender_id,
          receiver_id,
          message,
          type,
          file_url,
          duration,
          created_at: new Date(),
          client_temp_id // ? RETURN BACK
        };

        const receiverSocket = onlineUsers.get(receiver_id);

        if (receiverSocket) {
          io.to(receiverSocket).emit("receive_message", newMessage);
        }

        socket.emit("receive_message", newMessage);
      }
    );
  });

  // ----------------------------------------------------
  // ðŸ”¥ CALL SYSTEM (AGORA)
  // ----------------------------------------------------

  // Client â†’ Worker call request
  socket.on("call_user", (data) => {
    const receiverSocket = global.onlineUsers.get(data.receiverId);

    if (receiverSocket) {
      io.to(receiverSocket).emit("incoming_call", data);
    }
  });

  // Receiver â†’ accepts
  socket.on("call_accepted", (data) => {
    const callerSocket = global.onlineUsers.get(data.callerId);

    if (callerSocket) {
      io.to(callerSocket).emit("call_accepted", {
        callerId: data.callerId,
        channel: data.channel,
        token: data.token,
        uid: data.uid,
      });
    }
  });

  // Receiver â†’ rejects
  socket.on("call_rejected", (data) => {
    const callerSocket = global.onlineUsers.get(data.callerId);

    if (callerSocket) {
      io.to(callerSocket).emit("call_rejected", data);
    }
  });

  // End call
  socket.on("end_call", (data) => {
    const otherSocket = global.onlineUsers.get(data.otherId);

    if (otherSocket) {
      io.to(otherSocket).emit("call_ended");
    }
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of global.onlineUsers.entries()) {
      if (sid === socket.id) {
        global.onlineUsers.delete(uid);
        break;
      }
    }
  });
});

// ------------------- START SERVER -------------------
server.listen(app.get("port"), '0.0.0.0', () => {
  console.log(`Server running with Socket.IO on port ${app.get("port")}`);
});

// server.listen(app.get("port"), () => {
//   console.log(`ðŸš€ Server running with Socket.IO on port ${app.get("port")}`);
// });