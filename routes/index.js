const express = require("express");
const router = express.Router();

const fs = require("fs");
const snarkjs = require("snarkjs");
const path = require("path");
const os = require("os");
const { platform } = require("process");

const GPID_DEFAULT = function () {
  return {
    readSync: () => {
      return 0;
    },
    writeSync: () => { },
  };
};

// const GPIO = os.platform() === "linux" ? require("onoff").Gpio : GPID_DEFAULT;

const solenoid = new GPIO(75, "out");

let verificationResult = null;

const unlock = () => {
  if (solenoid.readSync() === 0) {
    console.log("solenoid status =", solenoid.readSync());
    solenoid.writeSync(1);
    console.log("solenoid received 1");
    verificationResult = true;
    setTimeout(() => {
      solenoid.writeSync(0);
      //   solenoid.unexport();
    }, 1000);
    setTimeout(() => {
      verificationResult = null;
    }, 5000);
  } else if (solenoid.readSync() !== 0) {
    console.error("SOLENOID!==0");
  }
};

// router.post("/open", (req, res) => {
//   try {
//     // unlock();
//     res.status(200).send();
//   } catch (e) {
//     console.error(e);
//     res.status(500).send({ error: e.toString() });
//   }
// });

// router.post("/", (req, res) => {
//   const proof = req.body.proof;
//   const publicSignals = req.body.publicSignals;

//   verify(proof, publicSignals, res).then((r) => {
//     console.log(r);
//   });
// });

router.post('/verify', (req, res) => {
  const proof = req.body.proof;
  const publicSignals = req.body.publicSignals;

  verify(proof, publicSignals, req, res);
});

router.get('/session-id', (req, res) => {
  const sessionId = req.cookies['connect.sid'];

  res.json({ sessionId: sessionId })
});

router.get("/verify", (req, res) => {
  if (req.session.verificationResult === undefined) {
    return res.json({ valid: "none" });} 
  if (req.session.verificationResult == false) {
    return res.json({ valid: "no" });
  } else {
    unlock
    return res.json({ valid: "yes" });
  }
});

router.get('/result', (req, res) => {
  console.log(req.sessionID)
  res.sendFile(path.join(__dirname, '../public/result.html'));
});

router.get('/', (req, res) => {
  req.session.verificationResult = verificationResult || 0;
  res.sendFile(path.join(__dirname, 'index.html'));
});
async function verify(proof, publicSignals, req, res) {
  let vKey;

  try {
    const CombinedCheck_vkey = fs.readFileSync(
      path.join(__dirname, "../PassportVerifierP256_64x4_736_vkey.json"),
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
      publicSignals,
      proof,
    );
    req.session.verificationResult = result;

    if (result === true) {
      //blinkLed() //blink LED on RaspberryPi
      res.json({ valid: true });
      console.log("Proof is valid!")
      console.log(req.sessionID)
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
