const snarkjs = require("snarkjs");
const fs = require("fs");
const express = require('express');
const bodyParser = require('body-parser');
const Gpio = require('onoff').Gpio;

const app = express();
const port = 3002;
const path = require('path');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

let verificationResult = null;
var LED = new Gpio(53, 'out');

app.post('/', (req, res) => {
  const proof = req.body.proof;
  const publicSignals = req.body.publicSignals;

  verify(proof, publicSignals, res);
});

app.get('/verify', (req, res) => {
  if (verificationResult === null) {
      return res.json({ valid: null });
  }
  res.json({ valid: verificationResult });
});

app.get('/result', (req, res) => {
  res.sendFile(path.join(__dirname, 'result.html'));
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

endBlink(){
  LED.writeSync(0)
  LED.unexport();
}

async function verify(proof, publicSignals, res) {

  let formattedPublicSignals;

  try {
    formattedPublicSignals = JSON.parse(publicSignals);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid publicSignals format' });
  }

  const vKey = JSON.parse(fs.readFileSync("../circuits/compiled/CombinedCheck_vkey.json"))

  const result = await snarkjs.groth16.verify(vKey, formattedPublicSignals, proof);

  verificationResult = result;

  if (result === true) {
    res.json({ valid: true });
    console.log("Proof is valid!")
    LED.writeSync(1);
    setTimeout(endBlink, 3000)
  } else {
    res.json({ valid: false });
    // res.status(400).json({ error: 'Invalid proof' });
    console.log("Proof is invalid!");
  }
}
