const { Router } = require("express");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const mysql = require("../dstsbase/database");

const CallRouter = Router();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERT;

CallRouter.post("/create", (req, res) => {
    const { caller_id, receiver_id } = req.body;

    if (!caller_id || !receiver_id) {
        return res.status(400).json({ error: "Missing caller_id or receiver_id" });
    }

    // 1. Generate channel name (ONLY HERE)
    const channel = `call_${caller_id}_${receiver_id}_${Date.now()}`;

    // 2. Generate token
    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expire = Math.floor(Date.now() / 1000) + 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERT,
        channel,
        uid,
        role,
        expire
    );

});

module.exports = CallRouter;