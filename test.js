const command = [
  `*Cari berdasarkan nama*\n*Command*: carinama <namaclient>\n*Contoh*: carinama daffa`,
  `*Cari berdasarkan IP*\n*Command*: cariip <ipclient>\n*Contoh*: cariip 192.168.10.121`,
  `*Hidupkan pelanggan*\n*Command*: hidupkan <ipclient>\n*Contoh*: hidupkan 192.168.10.121`,
  `*Disable pelanggan*\n*Command*: matikan <ipclient>\n*Contoh*: matikan 192.168.10.121`,
  `*Tambah pelanggan*\n*Command*: tambahclient <alamatip> <queue> <nama>\n*Contoh*: tambahclient 192.168.10.122 10/10 namapelanggan`
];
console.log(command.join('\n\n'));
