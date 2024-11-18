const snarkjs = require("snarkjs");
const fs = require("fs");
const express = require('express');
const bodyParser = require('body-parser');
const Gpio = require('onoff').Gpio;
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3002;
const path = require('path');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.use(cookieParser());

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
  }
}));

app.post('/verify', (req, res) => {
  const proof = req.body.proof;
  const publicSignals = req.body.publicSignals;

  verify(proof, publicSignals, req, res);
});

app.get('/session-id', (req, res) => {
  const sessionId = req.cookies['connect.sid'];

  res.json({sessionId:sessionId})
});

app.get("/verify", (req, res) => {
  if (req.session.verificationResult === undefined) {
    return res.json({ valid: "none" });
  } else if (req.session.verificationResult == false) {
    return res.json({ valid: "no" });
  } else {
    return res.json({ valid: "yes" });
  }
});

app.get('/result', (req, res) => {
  console.log(req.sessionID)
  res.sendFile(path.join(__dirname, 'result.html'));
});

app.get('/', (req, res) => {
  req.session.verificationResult = verificationResult || 0;
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

async function blinkLed() {
  var LED = new Gpio(538, 'out');

  if (LED.readSync() === 0) {
    LED.writeSync(1);

    setTimeout(() => {
      LED.writeSync(0)
      LED.unexport
    }, 3000)
  }
}

async function verify(proof, publicSignals, req, res) {
  let formattedPublicSignals;

  try {
    formattedPublicSignals = JSON.parse(publicSignals);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid publicSignals format' });
  }

  const vKey = JSON.parse(fs.readFileSync("./CombinedCheck_vkey.json"))

  try {
    const result = await snarkjs.groth16.verify(vKey, formattedPublicSignals, proof);

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
