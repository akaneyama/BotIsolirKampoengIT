const axios = require('axios');
const https = require('https');
const net = require('net');
require('dotenv').config(); // panggil dotenv paling atas


const username = process.env.USERNAME1;
const password = process.env.PASSWORD1;
const url = process.env.URL;
const urlkputih = process.env.URLKPUTIH;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function ambildatapakeAPI(targetalamatip, status) {
  let urlTarget;

  // Tentukan URL target berdasarkan prefix IP
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
  
    for (const alamaturlbinding of urls) {
      const response = await axios.get(alamaturlbinding, {
        httpsAgent,
        auth: { username, password }
      });
  
      semuaData = semuaData.concat(response.data);
    }
  
    const hasilPencarian = semuaData.filter(entry =>
      entry.comment &&
      entry.comment.toLowerCase().includes(namaPengguna.toLowerCase())
    );
  
    if (hasilPencarian.length === 0) {
      console.log(`Tidak ditemukan pengguna dengan nama diawali '${namaPengguna}'`);
      return;
    }

    const queuePromises = hasilPencarian.map(result => cariqueue(result.address));
    const queueResults = await Promise.all(queuePromises);

    let pesan = '';
    hasilPencarian.forEach((result, index) => {
      const status = result.disabled === "true" ? "Isolir" : "Aktif";
      pesan += `*comment*: ${result.comment}\n*address*: ${result.address}\n*status*: ${status}\n${queueResults[index]}\n\n`;
    });

  
    return pesan;
  } catch (error) {
    console.error("Gagal mengambil data:", error.message);
  }
  
}

// function checkPort(host, port) {
//   return new Promise((resolve) => {
//       const socket = new net.Socket();
//       socket.setTimeout(1000); 

//       socket.on('connect', () => {
//           socket.destroy();
//           resolve(true); 
//       });

//       socket.on('timeout', () => {
//           socket.destroy();
//           resolve(false); 
//       });

//       socket.on('error', () => {
//           resolve(false); 
//       });

//       socket.connect(port, host);
//   });
// }

// async function cariipkosong(total, ipdiminta) {
//   try {
//       const urls = [
//           `${url}/rest/ip/hotspot/ip-binding`,
//           `${urlkputih}/rest/ip/hotspot/ip-binding`
//       ];

//       let semuaData = [];
//       for (const alamaturlbinding of urls) {
//           const response = await axios.get(alamaturlbinding, {
//               httpsAgent,
//               auth: { username, password }
//           });
//           semuaData = semuaData.concat(response.data);
//       }

//       const hasilPencarian = semuaData
//           .filter(entry =>
//               entry.comment &&
//               entry.comment.toLowerCase().includes("new") && entry.address.includes(`192.168.${ipdiminta}`)
//           )
//           .slice(0, total);

//       if (hasilPencarian.length === 0) {
//           return `❌ Tidak ditemukan IP kosong.`;
//       }

//       let pesan = `📋 *Daftar IP Kosong (Port Tidak Aktif)*:\n\n`;
//       pesan += '```';
//       pesan += `No | Address         | Port  | Status\n`;
//       pesan += `---|----------------|-------|-----------\n`;

//       let no = 1;
//       let adaTidakAktif = false;

//       for (const result of hasilPencarian) {
//           const host = result.address;
//           const port = 80;
//           const isOpen = await checkPort(host, port);

//           if (!isOpen) {
//               adaTidakAktif = true;
//               pesan += `${String(no).padEnd(2)} | ${host.padEnd(15)} | ${String(port).padEnd(5)} | TIDAK AKTIF\n`;
//               no++;
//           }
//       }

//       pesan += '```';

//       if (!adaTidakAktif) {
//           return `✅ Semua port dari ${total} IP yang dicek aktif.`;
//       }

//       return pesan;

//   } catch (err) {
//       return `⚠️ Terjadi error: ${err.message}`;
//   }
// }

async function carialamatip(alamatip) {
  try {
    const urls = [
      `${url}/rest/ip/hotspot/ip-binding`,
      `${urlkputih}/rest/ip/hotspot/ip-binding`
    ];
  
    let semuaData = [];
    for (const alamaturlbinding of urls) {
      const response = await axios.get(alamaturlbinding, {
        httpsAgent,
        auth: { username, password }
      });
      
      semuaData = semuaData.concat(response.data);
  }
  const hasilPencarian = semuaData.filter(entry => 
    entry.address && entry.address.includes(alamatip)   
  );
  if (hasilPencarian.length === 0) {
    console.log(`Tidak ditemukan Alamat ip: '${alamatip}'`);
    return;
  }
  let pesan = '';

  const queuePromises = hasilPencarian.map(entry => cariqueue(entry.address));
  const queueResults = await Promise.all(queuePromises);
  
  hasilPencarian.forEach((result, index) => {
    const status = result.disabled === "true" ? "Isolir" : "Aktif";
    const hasilqueue = queueResults[index];
  
    pesan += `*comment*: ${result.comment}\n*address*: ${result.address}\n*status*: ${status}\n${hasilqueue}\n\n`;
  });
    return pesan;
}
catch (error){
  console.error("Gagal mengambil data:", error.message);
}
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
    return `*max limit*: ${result['max-limit']}`;
    
  } catch (error) {
    return `Gagal mengambil queue: ${error.message}`;
  }
}



async function editatautambahkanhotspot(alamatip, nama) {
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


// (async () => {
//   await ambildatapakeAPI("123.123.123.4", "hidupkan");
//   // await caripengguna("budi");
// })();
 

module.exports = {
  disableBindingID,
  ambildatapakeAPI,
  caripengguna, carialamatip, editatautambahkanhotspot
};