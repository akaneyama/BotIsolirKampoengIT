const axios = require('axios');
const https = require('https');
const net = require('net');
require('dotenv').config(); 

const username = process.env.USERNAME1;
const password = process.env.PASSWORD1;
const url = process.env.URL;
const urlkputih = process.env.URLKPUTIH;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function ambildatapakeAPI(targetalamatip, status) {
  let urlTarget;

  if (
    targetalamatip.startsWith("192.168") ||
    targetalamatip.startsWith("123.123") ||
    targetalamatip.startsWith("172.16")
  ) {
    urlTarget = url;
  } else if (targetalamatip.startsWith("193.168")) {
    urlTarget = urlkputih;
  } else {
    return "Alamat IP salah atau tidak ditemukan!";
  }

  try {
    const alamaturlbinding = `${urlTarget}/rest/ip/hotspot/ip-binding`;
    const response = await axios.get(alamaturlbinding, {
      httpsAgent,
      auth: { username, password }
    });

    const data = response.data;
    const result = data.find(entry => entry.address === targetalamatip);

    if (!result) {
      return `Data dengan IP ${targetalamatip} tidak ditemukan.`;
    }

    if (result.disabled === "true" && status.toLowerCase() === "matikan") {
      return `*User:* ${result.comment}\n*Status:* Sudah Isolir`;
    }
    else if (result.disabled === "false" && status.toLowerCase() === "hidupkan") {
      return `*User:* ${result.comment}\n*Status:* Sudah Hidup`;
    }

    const hasil = await disableBindingID(urlTarget, result[".id"], status);
    return `*User:* ${result.comment}\n*Status:* ${hasil}`;

  } catch (error) {
    return `Gagal mengambil data: ${error.message}`;
  }
}

async function disableBindingID(urlTarget, idIP, status) {
  const alamaturlbinding = `${urlTarget}/rest/ip/hotspot/ip-binding/${encodeURIComponent(idIP)}`;
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

  try {
    if (status.toLowerCase() === "matikan") {
      await axios.patch(alamaturlbinding, { disabled: "true" }, {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      });
      return `ID ${idIP} berhasil di-disable`;
    } else if (status.toLowerCase() === "hidupkan") {
      await axios.patch(alamaturlbinding, { disabled: "false" }, {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      });
      return `ID ${idIP} berhasil di-hidupkan`;
    } else {
      return `Perintah status tidak sesuai. Pilih antara 'hidupkan' atau 'matikan'.`;
    }
  } catch (error) {
    return `Gagal mengubah status binding: ${error.message}`;
  }
}

async function caripengguna(namaPengguna) {
  try {
    const urls = [
      `${url}/rest/ip/hotspot/ip-binding`,
      `${urlkputih}/rest/ip/hotspot/ip-binding`
    ];

    let semuaData = [];
    let semuaQueue = {};

    // ambil semua binding + queue sekali per router
    for (const alamaturlbinding of urls) {
      const response = await axios.get(alamaturlbinding, {
        httpsAgent,
        auth: { username, password }
      });

      semuaData = semuaData.concat(response.data);

      const baseUrl = alamaturlbinding.replace("/rest/ip/hotspot/ip-binding", "");
      semuaQueue[baseUrl] = await getAllQueue(baseUrl); // fungsi getAllQueue sama dengan yg tadi
    }

    // filter hasil binding berdasarkan comment (nama pengguna)
    const hasilPencarian = semuaData.filter(entry =>
      entry.comment &&
      entry.comment.toLowerCase().includes(namaPengguna.toLowerCase())
    );

    if (hasilPencarian.length === 0) {
      console.log(`Tidak ditemukan pengguna dengan nama mengandung '${namaPengguna}'`);
      return;
    }

    let pesan = "";

    for (const result of hasilPencarian) {
      const status = result.disabled === "true" ? "Isolir" : "Aktif";

      // tentukan asal router dari IP
      let baseUrl;
      if (
        result.address.startsWith("192.168") ||
        result.address.startsWith("123.123") ||
        result.address.startsWith("172.16")
      ) {
        baseUrl = url;
      } else if (result.address.startsWith("193.168")) {
        baseUrl = urlkputih;
      }

      // cari queue dari cache semuaQueue
      const queueList = semuaQueue[baseUrl] || [];
      const q = queueList.find(q => q.target === `${result.address}/32`);
      const hasilqueue = q 
      ? `*max limit*: ${formatSpeed(q["max-limit"])}` 
      : "*max limit*: tidak ada";

      pesan += `*comment*: ${result.comment}\n*address*: ${result.address}\n*status*: ${status}\n${hasilqueue}\n\n`;
    }

    return pesan;
  } catch (error) {
    console.error("Gagal mengambil data:", error.message);
  }
}

async function carialamatip(alamatip) {
  try {
    const urls = [
      `${url}/rest/ip/hotspot/ip-binding`,
      `${urlkputih}/rest/ip/hotspot/ip-binding`
    ];
  
    let semuaData = [];
    let semuaQueue = [];

    for (const alamaturlbinding of urls) {
      const response = await axios.get(alamaturlbinding, {
        httpsAgent,
        auth: { username, password }
      });
      
      semuaData = semuaData.concat(response.data);

       const baseUrl = alamaturlbinding.replace("/rest/ip/hotspot/ip-binding", "");
      semuaQueue[baseUrl] = await getAllQueue(baseUrl);
  }
  const hasilPencarian = semuaData.filter(entry => 
    entry.address && entry.address.includes(alamatip)   
  );
  if (hasilPencarian.length === 0) {
    console.log(`Tidak ditemukan Alamat ip: '${alamatip}'`);
    return;
  }
  let pesan = '';

    for (const result of hasilPencarian) {
      const status = result.disabled === "true" ? "Isolir" : "Aktif";

      let baseUrl;
      if (
        result.address.startsWith("192.168") ||
        result.address.startsWith("123.123") ||
        result.address.startsWith("172.16")
      ) {
        baseUrl = url;
      } else if (result.address.startsWith("193.168")) {
        baseUrl = urlkputih;
      }

      const queueList = semuaQueue[baseUrl] || [];
      const q = queueList.find(q => q.target === `${result.address}/32`);
      const hasilqueue = q 
      ? `*max limit*: ${formatSpeed(q["max-limit"])}` 
      : "*max limit*: tidak ada";

      pesan += `*comment*: ${result.comment}\n*address*: ${result.address}\n*status*: ${status}\n${hasilqueue}\n\n`;
    }

    return pesan;
  } catch (error) {
    console.error("Gagal mengambil data:", error.message);
  }
}

function formatSpeed(limitStr) {
  if (!limitStr) return "tidak ada";

  const [uploadStr, downloadStr] = limitStr.split("/");
  const upload = parseInt(uploadStr, 10);
  const download = parseInt(downloadStr, 10);

  function convertToMbps(value) {
    if (isNaN(value)) return "N/A";
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)} Mbps`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)} Kbps`;
    } else {
      return `${value} bps`;
    }
  }

  return `${convertToMbps(upload)} / ${convertToMbps(download)}`;
}

async function cariqueue(alamatip) {
  let urlTarget;
  if (
    alamatip.startsWith("192.168") ||
    alamatip.startsWith("123.123") ||
    alamatip.startsWith("172.16")
  ) {
    urlTarget = url;
  } else if (alamatip.startsWith("193.168")) {
    urlTarget = urlkputih;
  } else {
    return "Alamat IP salah atau tidak ditemukan!";
  }
  try {
    const response = await axios.get(`${urlTarget}/rest/queue/simple`, {
      httpsAgent,
      auth: { username, password }
    });
    const result = response.data.find(entry => entry.target === `${alamatip}/32`);

    if (!result) {
      return `*max limit*: tidak ada`;
    }
    return `*max limit*: ${formatSpeed(q["max-limit"])}`;
    
  } catch (error) {
    return `Gagal mengambil queue: ${error.message}`;
  }
}

async function getAllQueue(urlTarget) {
  try {
    const response = await axios.get(`${urlTarget}/rest/queue/simple`, {
      httpsAgent,
      auth: { username, password }
    });
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil semua queue:", error.message);
    return [];
  }
}



async function editatautambahkanhotspot(alamatip, queue, nama) {
  let urlTarget;
  if (
    alamatip.startsWith("192.168") ||
    alamatip.startsWith("123.123") ||
    alamatip.startsWith("172.16")
  ) {
    urlTarget = url;
  } else if (alamatip.startsWith("193.168")) {
    urlTarget = urlkputih;
  } else {
    return "Alamat IP salah atau tidak ditemukan!";
  }
  try{
    const alamaturlbinding = `${urlTarget}/rest/ip/hotspot/ip-binding`;
    const response = await axios.get(alamaturlbinding, {
      httpsAgent,
      auth: { username, password }
    });
    const data = response.data;
    const result = data.find(entry => entry.address === alamatip);

    if(!result){
      const hasiltambahhotspot = await tambahhotspot(alamaturlbinding,alamatip,nama);
      if (hasiltambahhotspot == true){
        const hasil = await carialamatip(alamatip);
        return hasil
      }
      else{
        return "Gagal. Perbaiki alamat ip atau nama!";
      }
    }
    const hasiledithotspot = await edithotspot(alamaturlbinding, result[".id"], nama);
    if (hasiledithotspot == true){
      const hasil = await carialamatip(alamatip);
      return hasil
    }
    else{
      return "Gagal. Perbaiki alamat ip atau nama!"
    }
  }
  catch (error){
    return `${error.message}`;
  }

  async function edithotspot(url,id,nama) {
    const alamaturlubah = `${url}/${encodeURIComponent(id)}`;
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

   try{
    await axios.patch(alamaturlubah, {comment: `${nama.toString()}`}, {
      httpsAgent,
       headers: {
         'Content-Type': 'application/json',
         'Authorization': authHeader
       }
     });
     return true;
   }
   catch (error){
    return false;
   }
  }

  async function tambahhotspot(url, alamatip, nama) {
    const alamatipubah = `${url}/add`;
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    try{
      await axios.post(alamatipubah, {
        "address": `${alamatip}`,
        "type": "bypassed",
        "disabled": "no",
        "comment": `${nama}`
    }, {
      httpsAgent,
       headers: {
         'Content-Type': 'application/json',
         'Authorization': authHeader
       }
    });
    return true;
    }
    catch (error){
      return false;
    }
    
  }
}

async function carieditdantambahqueue(alamatip, nama, queue) {
  let urlTarget;
    if (
    alamatip.startsWith("192.168") ||
    alamatip.startsWith("123.123") ||
    alamatip.startsWith("172.16")
  ) {
    urlTarget = url;
  } else if (alamatip.startsWith("193.168")) {
    urlTarget = urlkputih;
  } else {
    return "Alamat IP salah atau tidak ditemukan!";
  }
  try{
    const alamaturlbinding = `${urlTarget}/rest/queue/simple`;
    const response = await axios.get(alamaturlbinding, {
      httpsAgent,
      auth: { username, password }
    });
    const data = response.data;
    const result = data.find(entry => entry.target === alamatip);
    if (!result){

    }
    else{

    }


  }
  catch (error) {
    return `${error.message}`;
  }
}



module.exports = {
  disableBindingID,
  ambildatapakeAPI,
  caripengguna, 
  carialamatip, 
  editatautambahkanhotspot
};