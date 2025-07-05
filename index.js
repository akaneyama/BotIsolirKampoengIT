const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    proto
  } = require('@whiskeysockets/baileys');
  const { Boom } = require('@hapi/boom');
  const fs = require('fs');
  const qrcode = require('qrcode');
  const express = require('express');
  const { disableBindingID, ambildatapakeAPI, caripengguna } = require('./apiKIT');
  
  let qrData = ''; 
  
  const app = express();
  const PORT = 3000;
  
  app.get('/', (req, res) => {
    if (qrData) {
      res.send(`
        <h1>Scan QR Code WhatsApp</h1>
        <img src="${qrData}" />
      `);
    } else {
      res.send('<h1>QR belum tersedia. Tunggu sebentar...</h1>');
    }
  });
  
  const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });
  
    sock.ev.on('creds.update', saveCreds);
  
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
  
      if (qr) {
        console.log('📷 QR tersedia! Juga tampil di browser http://localhost:' + PORT);
        qrData = await qrcode.toDataURL(qr); 
      }
  
      if (connection === 'open') {
        console.log('Bot terkoneksi ke WhatsApp!');
        qrData = ''; 
      }
  
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log('Logout. Jalankan ulang dan scan QR lagi.');
          fs.rmSync('auth_info', { recursive: true, force: true });
          process.exit();
        } else {
          console.log('Koneksi ditutup, reconnecting...');
          startBot();
        }
      }
    });
  
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;
  
      const sender = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  
      if (text.toLowerCase().startsWith('carinama')) {
        const namauser = text.slice(9).trim();
        (async () => {
          const hasil = await caripengguna(namauser)
          const buttonMessage = {
            text: `${hasil}`
          };
              await sock.sendMessage(sender, buttonMessage);
        })();
       
      }
      else if (text.toLowerCase().startsWith('hidupkan')) {
        const ipuser = text.slice(9).trim();
        if(ipuser.split('.').length === 4 && ipuser.startsWith('192.168') || ipuser.startsWith('123.123') || 
        ipuser.startsWith('172.16') || ipuser.startsWith('193.168')){
          (async () => {
            const hasil = await ambildatapakeAPI(ipuser, "hidupkan");
            const buttonMessage = {
              text: `${hasil}`
            };
                await sock.sendMessage(sender, buttonMessage);
          })();
        }
        else{
          const buttonMessagegagal = {
            text: "Mohon Maaf ip yang anda masukkan kurang lengkap atau salah."
          };
          await sock.sendMessage(sender, buttonMessagegagal);
        }
      }
      else if (text.toLowerCase().startsWith('matikan')) {
        const ipuser = text.slice(8).trim();
        if(ipuser.split('.').length === 4 && ipuser.startsWith('192.168') || ipuser.startsWith('123.123') || 
        ipuser.startsWith('172.16') || ipuser.startsWith('193.168')){
          (async () => {
            const hasil = await ambildatapakeAPI(ipuser, "matikan");
            const buttonMessage = {
              text: `${hasil}`
            };
                await sock.sendMessage(sender, buttonMessage);
          })();
        }
        else{
          const buttonMessagegagal = {
            text: "Mohon Maaf ip yang anda masukkan kurang lengkap atau salah."
          };
          await sock.sendMessage(sender, buttonMessagegagal);
        }
      }
    });
  };
  
  app.listen(PORT, () => {
    console.log(`🌐 Buka http://localhost:${PORT} untuk scan QR Code`);
  });
  
  startBot();
  