const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2
const http = require('http');
const { Server } = require('socket.io');
const mysqlconnection = require('./dstsbase/database.js');

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERT;

// ADD HERE
console.log("APP ID =", APP_ID);
console.log("APP CERT =", APP_CERT ? "FOUND" : "MISSING");

// ------------------- APP INIT -------------------
const app = express();
app.use(cors());
app.set('port', process.env.PORT || 5000);
app.use(express.json());

// ------------------- ROUTES -------------------
app.use('/api/user/', require('./Router/UserRouter'));
app.use('/api/Complaint/', require('./Router/ComplaintRouter'));
app.use('/api/notification/', require('./Router/NotificationRouter'));
app.use('/api/booking/', require('./Router/BookingRouter'));
app.use('/api/send/', require('./Router/SendRouter'));
app.use('/api/favour/', require('./Router/FavRouter'));
// app.use('/api/evc-pay/', require('./Router/EvcRouter'));
// app.use('/api/contact/', require('./Router/ContactRouter'));
// app.use('/api/account_delete/', require('./Router/AccountDeleteRouter'));
app.use('/api/chatmessages/', require('./Router/ChatMessagesRouter.js'));
app.use('/api/amenity/', require('./Router/AmenitiesRouter.js'));
app.use('/api/property/', require('./Router/PropertyRouter.js'));
app.use('/api/country/', require('./Router/CountryRouter.js'));
app.use('/api/region/', require('./Router/RegionRouter.js'));
app.use('/api/district/', require('./Router/DistrictRouter.js'));
app.use('/api/village/', require('./Router/VillagesRouter.js'));
app.use('/api/property_rules/', require('./Router/PropertyRulesRouter.js'));
app.use('/api/document/', require('./Router/DocumentRouter.js'));
app.use('/api/favour/', require('./Router/FavRouter.js'));
app.use('/api/rented/', require('./Router/RentedRouter.js'));
app.use('/api/complaint/', require('./Router/ComplaintRouter.js'));
app.use('/api/maintenance/', require('./Router/MaintenanceRouter.js'));
app.use('/api/payment/', require('./Router/PaymentRouter.js'));
app.use('/uploads', express.static('uploads'));
app.get('/uploads/:filename', (req, res) => {
  const filePath = __dirname + '/uploads/' + req.params.filename;
  res.setHeader('Content-Type', 'video/mp4');
  res.sendFile(filePath);
});
app.use('/api/agora/', require('./Router/CallRouter.js'));
app.use('/api/property_images/', require('./Router/PropertyImagesRouter.js'));
app.use('/api/recent_activities/', require('./Router/RecentActivityRouter.js'));
app.use('/api/chat_group/', require('./Router/GroupChatRouter.js'));
app.use('/api/group_member/', require('./Router/GroupMembersRouter.js'));
app.use('/api/calls/', require('./Router/CallDetailsRouter.js'));
app.use('/api/sms/', require('./Router/SmsRouter'));
app.use('/api/wallet/', require('./Router/WalletRouter.js'));
app.use('/api/unit/', require('./Router/UnitRouter.js'));
app.use('/api/floor/', require('./Router/FloorRouter.js'));
app.use('/api/technician/', require('./Router/TechnicianRouter.js'));
app.use('/api/unit_images/', require('./Router/UnitImagesRouter.js'));
app.use('/api/chat/', require('./Router/ChatRouter.js'));
app.use('/api/Withdrawal/', require('./Router/WithdrawalRouter.js'));
app.use('/api/property_video/', require('./Router/PropertyVideoRouter.js'));
app.use('/api/uploadvideo', require('./Router/UploadRouter.js'));




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
//     console.log(`Pinged ${MAIN_ROUTE} Ã¢â€ â€™ Status: ${res.status}`);
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
const activeChats = new Map();
global.io = io;                // make accessible globally
global.onlineUsers = onlineUsers;



global.onlineUsers = onlineUsers;
global.activeChats = activeChats;

// ------------------- SOCKET EVENTS -------------------

io.on("connection", (socket) => {
  console.log("Ã°Å¸Å¸Â¢ User connected:", socket.id);

  // REGISTER USER
  socket.on("join", (user_id) => {
    onlineUsers.set(user_id, socket.id);
    console.log(`Ã°Å¸â€˜Â¤ User ${user_id} registered with socket ${socket.id}`);
  });

  socket.on("open_chat", (data) => {

    const {
      user_id,
      receiver_id
    } = data;


    activeChats.set(
      user_id.toString(),
      receiver_id.toString()
    );


    console.log(
      "ACTIVE CHAT",
      user_id,
      "with",
      receiver_id
    );

  });

  socket.on("close_chat", (data) => {

    const user_id = data.user_id;

    activeChats.delete(
      user_id.toString()
    );

  });

  socket.on("mark_read", (data) => {

    mysqlconnection.query(
      `
UPDATE messages
SET receiver_status='read'
WHERE sender_id=?
AND receiver_id=?
AND receiver_status='unread'
`,
      [
        data.sender_id,
        data.receiver_id
      ],
      (err) => {

        if (err)
          console.log(err);

      });

  });

  // ----------------------------------------------------
  // Ã°Å¸â€Â¥ CHAT SYSTEM
  // ----------------------------------------------------
  // ?? CHAT SYSTEM
  // ----------------------------------------------------
  socket.on("send_message", (data) => {
    let { chat_id, sender_id, receiver_id, message, type, file_url, duration, client_temp_id } = data;

    message = message ?? "";
    file_url = file_url ?? "";
    duration = duration ?? "";

    const receiverSocket = onlineUsers.get(receiver_id);
    const sender_status = "read";

    const receiverIsChatting =
      activeChats.get(receiver_id.toString()) === sender_id.toString();

    const receiver_status = receiverIsChatting ? "read" : "unread";

    mysqlconnection.query(
      `INSERT INTO messages 
    (chat_id, sender_id, receiver_id, message, type, file_url, duration, sender_status, receiver_status, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [chat_id, sender_id, receiver_id, message, type, file_url, duration, sender_status, receiver_status],
      (error, result) => {
        if (error) return console.error("DB error in socket send_message:", error);

        const newMessage = {
          id: result.insertId,
          chat_id,
          sender_id,
          receiver_id,
          message,
          type,
          file_url,
          duration,
          sender_status,
          receiver_status,
          created_at: new Date(),
          client_temp_id
        };

        if (receiverSocket) {
          io.to(receiverSocket).emit("receive_message", newMessage);
        }
        socket.emit("receive_message", newMessage);
      }
    );
  });

  socket.on("send_group_message", (data) => {
    let {
      group_id,
      sender_id,
      message,
      type,
      file_url,
      duration,
      client_temp_id
    } = data;

    // Default statuses for group processing
    const sender_status = "read";
    const receiver_status = "unread";

    mysqlconnection.query(
      `INSERT INTO group_messages
      (group_id, sender_id, message, type, file_url, duration, sender_status, receiver_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        group_id,
        sender_id,
        message ?? "",
        type ?? "text",
        file_url ?? "",
        duration ?? "",
        sender_status,
        receiver_status
      ],
      (error, result) => {
        if (error) {
          console.error("DB error in group message:", error);
          return;
        }

        const newMessage = {
          id: result.insertId,
          group_id,
          sender_id,
          message: message ?? "",
          type: type ?? "text",
          file_url: file_url ?? "",
          duration: duration ?? "",
          sender_status,
          receiver_status,
          created_at: new Date(),
          client_temp_id
        };

        io.to(`group_${group_id}`).emit("group_receive_message", newMessage);
      }
    );
  });

  // ----------------------------------------------------
  // Ã°Å¸â€Â¥ CALL SYSTEM (AGORA)
  // ----------------------------------------------------

  // Client Ã¢â€ â€™ Worker call request
  socket.on("call_user", (data) => {
    console.log("CALLING:", data.receiverId);

    const receiverSocket =
      global.onlineUsers.get(data.receiverId);

    console.log(
      "RECEIVER SOCKET:",
      receiverSocket
    );

    if (receiverSocket) {
      io.to(receiverSocket)
        .emit("incoming_call", data);
    } else {
      console.log("USER OFFLINE");
    }
  });

  // Receiver Ã¢â€ â€™ accepts
  socket.on("call_accepted", (data) => {
    const callerSocket = global.onlineUsers.get(data.callerId);

    if (callerSocket) {
      io.to(callerSocket).emit("call_accepted", {
        callerId: data.callerId,
        channel: data.channel,
        token: data.token,
        uid: data.uid,
        type: data.type // IMPORTANT
      });
    }
  });

  // Receiver Ã¢â€ â€™ rejects
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
//   console.log(`Ã°Å¸Å¡â‚¬ Server running with Socket.IO on port ${app.get("port")}`);
// });