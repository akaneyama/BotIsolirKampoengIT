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
  const { disableBindingID, ambildatapakeAPI, caripengguna, editatautambahkanhotspot , carialamatip} = require('./apiKIT');
  require('dotenv').config();

  let qrData = ''; 
  
  const app = express();
  const PORT = 3010;
  
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
  const allowedUsers = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(',').map(nomor => nomor.trim() + '@s.whatsapp.net')
  : [];

  function hanyaBoleh(nomor) {
    return allowedUsers.includes(nomor);
  }
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;
  
      const isGroup = msg.key.remoteJid.endsWith('@g.us');
      const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
      const getTextFromMessage = (message) => {
        if (message.conversation) return message.conversation;
        if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
        if (message.ephemeralMessage?.message?.conversation)
          return message.ephemeralMessage.message.conversation;
        if (message.ephemeralMessage?.message?.extendedTextMessage?.text)
          return message.ephemeralMessage.message.extendedTextMessage.text;
        return '';
      };
      const text = getTextFromMessage(msg.message);
    

      if (text.toLowerCase().startsWith('carinama')) {
        if (!hanyaBoleh(sender)) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Anda tidak memiliki izin untuk menggunakan perintah *carinama*.'
          });
          return;
        }
        const namauser = text.slice(9).trim();
        await sock.sendMessage(msg.key.remoteJid, {
          text: 'Mohon menunggu. Server sedang menangani permintaan anda!'
        });
        (async () => {
          const hasil = await caripengguna(namauser)
          const buttonMessage = {
            text: `${hasil}`
          };
              await sock.sendMessage(msg.key.remoteJid, buttonMessage);
        })();
       
      }
      else if (text.toLowerCase().startsWith('cariip')) {
        if (!hanyaBoleh(sender)) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Anda tidak memiliki izin untuk menggunakan perintah *cariip*.'
          });
          return;
        }
        const alamatip = text.slice(7).trim();
        await sock.sendMessage(msg.key.remoteJid, {
          text: 'Mohon menunggu. Server sedang menangani permintaan anda!'
        });
        (async () => {
          const hasil = await carialamatip(alamatip)
          const buttonMessage = {
            text: `${hasil}`
          };
              await sock.sendMessage(msg.key.remoteJid, buttonMessage);
        })();
       
      }
      else if (text.toLowerCase().startsWith('hidupkan')) {
        if (!hanyaBoleh(sender)) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Anda tidak memiliki izin untuk menggunakan perintah *carinama*.'
          });
          return;
        }
        const ipuser = text.slice(9).trim();
        if(ipuser.split('.').length === 4 && ipuser.startsWith('192.168') || ipuser.startsWith('123.123') || 
        ipuser.startsWith('172.16') || ipuser.startsWith('193.168')){
          (async () => {
            const hasil = await ambildatapakeAPI(ipuser, "hidupkan");
            const buttonMessage = {
              text: `${hasil}`
            };
                await sock.sendMessage(msg.key.remoteJid, buttonMessage);
          })();
        }
        else{
          const buttonMessagegagal = {
            text: "Mohon Maaf ip yang anda masukkan kurang lengkap atau salah."
          };
          await sock.sendMessage(msg.key.remoteJid, buttonMessagegagal);
        }
      }

      else if (text.toLowerCase().startsWith('matikan')) {
        if (!hanyaBoleh(sender)) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Anda tidak memiliki izin untuk menggunakan perintah *carinama*.'
          });
          return;
        }
        const ipuser = text.slice(8).trim();
        if(ipuser.split('.').length === 4 && ipuser.startsWith('192.168') || ipuser.startsWith('123.123') || 
        ipuser.startsWith('172.16') || ipuser.startsWith('193.168')){
          (async () => {
            const hasil = await ambildatapakeAPI(ipuser, "matikan");
            const buttonMessage = {
              text: `${hasil}`
            };
                await sock.sendMessage(msg.key.remoteJid, buttonMessage);
          })();
        }
        else{
          const buttonMessagegagal = {
            text: "Mohon Maaf ip yang anda masukkan kurang lengkap atau salah."
          };
          await sock.sendMessage(msg.key.remoteJid, buttonMessagegagal);
        }
      }

      else if (text.toLowerCase().startsWith('tambahclient')) {
       try{
        const args = text.trim().split(/\s+/);
        const alamatip = args[1]
        const nama = args.slice(2).join(" "); 
        const totalalamatip = alamatip.trim().split('.');
        if (totalalamatip.length == 4){
          hasil = await editatautambahkanhotspot(alamatip,nama);
          await sock.sendMessage(msg.key.remoteJid, {
          text: hasil
        });
        }
      }
      catch(error){
          await sock.sendMessage(msg.key.remoteJid, {
          text: error.message
        });
      }
      }
   
    });

    
  };
  
  app.listen(PORT, () => {
    console.log(`🌐 Buka http://localhost:${PORT} untuk scan QR Code`);
  });
  
  startBot();
  