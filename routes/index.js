const express = require('express');
const router = express.Router();

const snarkJS = require("snarkjs");
const fs = require("fs");

const Gpio = require('onoff').Gpio;

let verificationResult= null;
//setTimeout(() => {verificationResult = true}, 10000);
const LED = new Gpio(65, 'out');
const solenoid = new Gpio(75, 'out');

router.get('/open', (req, res) => {
  if (solenoid.readSync() === 0) {
    solenoid.writeSync(1);
    setTimeout(() => { solenoid.writeSync(0); }, 1000);
  }
	solenoid.unexport();
});

router.post('/', (req, res) => {
  const proof = req.body.proof;
  const publicSignals = req.body.publicSignals;

  verify(proof, publicSignals, res).then(r => {
    console.log(r);
  });
});

router.get('/verify', (req, res) => {
  /**
   * Замки
   */
  if (verificationResult === true) {
    if (solenoid.readSync() === 0) {
      solenoid.writeSync(1);
      setTimeout(() => {
        solenoid.writeSync(0);
      },1000);
    }
  }
  res.json({ valid: verificationResult });
  // Reset
  verificationResult = null;
});

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function verify(proof, publicSignals, res) {

  let formattedPublicSignals, vKey;

  try {
    formattedPublicSignals = JSON.parse(publicSignals);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid publicSignals format' });
  }

  try {
    const CombinedCheck_vkey = fs.readFileSync("../lib/CombinedCheck_vkey.json", { encoding: 'utf8' });
    vKey = JSON.parse(CombinedCheck_vkey);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid CombinedCheck_vkey format' });
  }

  const result = await snarkJS.groth16.verify(vKey, formattedPublicSignals, proof);

  verificationResult = result;

  if (result === true) {
    res.json({ valid: true });
    console.log("Proof is valid!")
    LED.writeSync(1);
    setTimeout(function () {
      LED.writeSync(0)
    }, 3000)
  } else {
    res.json({ valid: false });
    // res.status(400).json({ error: 'Invalid proof' });
    console.log("Proof is invalid!");
  }
}


process.on("beforeExit", (code) => {
  console.log('BeforeExit code: ', code);

  solenoid.writeSync(0);
  solenoid.unexport();

  LED.writeSync(0);
  LED.unexport();
});

module.exports = router;
