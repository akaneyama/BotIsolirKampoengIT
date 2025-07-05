const axios = require('axios');
const https = require('https');


const username = 'akane'; 
const password = 'akaneyama123'; 
const url = 'https://lbkampoengit.daffaaditya.my.id:43987';
const urlkputih = 'https://lbkampoengit.daffaaditya.my.id:43989';

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
  
    let pesan = '';
    for (const result of hasilPencarian) {
      const status = result.disabled === "true" ? "Isolir" : "Aktif";
      pesan += `🧾 *comment*: ${result.comment}\n📍 *address*: ${result.address}\n🔒 *status*: ${status}\n\n`;
    }
  
    return pesan;
  } catch (error) {
    console.error("Gagal mengambil data:", error.message);
  }
  
}


// (async () => {
//   await ambildatapakeAPI("123.123.123.4", "hidupkan");
//   // await caripengguna("budi");
// })();
 

module.exports = {
  disableBindingID,
  ambildatapakeAPI,
  caripengguna
};