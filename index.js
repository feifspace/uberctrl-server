const { Server } = require('socket.io');
const SSH2Shell = require ('ssh2shell');
const CryptoJS = require("crypto-js");

const io = new Server(require('fs').readFileSync('port', 'utf8'));

io.on("connection", (socket) => {
  // ...
  console.log('checker')
});