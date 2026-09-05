const { Router } = require("express");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const CallRouter = Router();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERT;

// CREATE CALL TOKEN
CallRouter.post("/create", async (req, res) => {
  try {
    const {
      caller_id,
      caller_name,
      receiver_id,
      receiver_name,
      type // audio or video
    } = req.body;

    if (!caller_id || !receiver_id) {
      return res.status(400).json({
        error: "Missing caller_id or receiver_id"
      });
    }

    // UNIQUE CHANNEL
    const channel = `call_${caller_id}_${receiver_id}_${Date.now()}`;

    // UID FOR CALLER
    const caller_uid = Math.floor(Math.random() * 100000);

    // UID FOR RECEIVER
    const receiver_uid = Math.floor(Math.random() * 100000);

    const role = RtcRole.PUBLISHER;

    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    // CALLER TOKEN
    const caller_token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERT,
      channel,
      caller_uid,
      role,
      privilegeExpireTime
    );

    // RECEIVER TOKEN
    const receiver_token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERT,
      channel,
      receiver_uid,
      role,
      privilegeExpireTime
    );

    return res.json({
      success: true,
      channel,
      caller_id,
      caller_name,
      receiver_id,
      receiver_name,
      caller: {
        token: caller_token,
        uid: caller_uid
      },
      receiver: {
        token: receiver_token,
        uid: receiver_uid
      },
      type
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = CallRouter;