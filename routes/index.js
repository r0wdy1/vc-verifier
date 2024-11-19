const express = require("express");
const router = express.Router();

const snarkJS = require("snarkjs");
const fs = require("fs");
const snarkjs = require("snarkjs");
const path = require("path");
const os = require("os");
const { platform } = require("process");

const Gpio = function () {};
if (os.platform() === "linux") {
  const Gpio = require("onoff").Gpio;
}

let verificationResult = null;
const LED = new Gpio(64, "out");
const unlock = () => {
  const solenoid = new Gpio(75, "out");
  if (solenoid.readSync && solenoid.readSync() === 0) {
    solenoid.writeSync(1);
    setTimeout(() => {
      solenoid.writeSync(0);
      solenoid.unexport();
    }, 1000);
  }
};
router.post("/open", (req, res) => {
  unlock();
});

router.post("/", (req, res) => {
  const proof = req.body.proof;
  const publicSignals = req.body.publicSignals;

  verify(proof, publicSignals, res).then((r) => {
    console.log(r);
  });
});

router.post("/verify", (req, res) => {
  const proof = req.body.proof;
  const publicSignals = req.body.publicSignals;

  verify(proof, publicSignals, req, res).then((r) => {
    // console.log(r);
  });
});

router.get("/session-id", (req, res) => {
  const sessionId = req.cookies["connect.sid"];

  res.json({ sessionId: sessionId });
});

router.get("/verify", (req, res) => {
  /**
   * Замки
   */
  if (verificationResult === true) {
    unlock();
  }
  if (verificationResult) {
    console.log("returning verificationResult=", verificationResult);
  }
  res.json({ valid: verificationResult });
  // Reset
  verificationResult = null;
});

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
router.get("/result", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/result.html"));
});

async function verify(proof, publicSignals, req, res) {
  let formattedPublicSignals, vKey;

  try {
    formattedPublicSignals = JSON.parse(publicSignals);
  } catch (error) {
    console.error("Invalid publicSignals format");
    return res.status(400).json({ error: "Invalid publicSignals format" });
  }

  try {
    const CombinedCheck_vkey = fs.readFileSync(
      path.join(__dirname, "../CombinedCheck_vkey.json"),
      { encoding: "utf8" },
    );
    vKey = JSON.parse(CombinedCheck_vkey);
  } catch (error) {
    console.error("Invalid CombinedCheck_vkey format", error);
    return res.status(400).json({ error: "Invalid CombinedCheck_vkey format" });
  }

  try {
    const result = await snarkjs.groth16.verify(
      vKey,
      formattedPublicSignals,
      proof,
    );
    // console.warn("verificationResult HERE")
    req.session.verificationResult = result;

    if (result === true) {
      //blinkLed() //blink LED on RaspberryPi

      res.json({ valid: true });
      console.log("Proof is valid!");
      console.log(req.sessionID);
      verificationResult = true;
    } else {
      res.json({ valid: false });
      // res.status(400).json({ error: 'Invalid proof' });
      console.log("Proof is invalid!");
    }
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
    console.error("Verification error:", error);
  }
}

module.exports = router;
