const mysql = require('mysql2')
const msgHandler = require('./msgHandler.js')
const absensiMurid = async (from) => {
  const connection = mysql.createConnection({
      host: msgHandler.account.host,
      user: msgHandler.account.host,
      password : msgHandler.account.password,
      database: msgHandler.account.database
  });

  try {
    const [[idMurid]] = await connection.promise().query('CALL DapatkanIdMuridBerdasarkanNoTelf(?)', [from]);
    const [existingAbsensi] = await connection.promise().query(`
      SELECT *
      FROM absensi
      WHERE idMurid = ? AND DATE(absensiMasuk) = CURDATE()
    `, [idMurid[0].idMurid]);
    if (!existingAbsensi.length) {
      await connection.promise().query(`
        INSERT INTO absensi (idMurid, absensiMasuk)
        VALUES (?, NOW())
      `, [idMurid[0].idMurid]);
      return `Data absensiMasuk berhasil disimpan.`;
    } else {
      if (existingAbsensi[0].absensiPulang) {
        return 'Kamu hari ini sudah absensi pulang.';
      }
      await connection.promise().query(`
        UPDATE absensi
        SET absensiPulang = NOW()
        WHERE idMurid = ? AND DATE(absensiMasuk) = CURDATE()
      `, [idMurid[0].idMurid]);
      return `Data absensiPulang berhasil disimpan.`;
    }    
  } catch (error) {
      console.error('Error:', error);
  } finally {
      await connection.end();
  }
};
const runQuery = async (client, from, id) => {
  const connection = mysql.createConnection({
    host: msgHandler.account.host,
    user: msgHandler.account.root,
    password : msgHandler.account.password,
    database: msgHandler.account.database,
  });

  try {
    const query = `
      SELECT
        l.idLaporan,
        a.idAbsensi,
        GROUP_CONCAT(n.idNilai) AS idNilai,
        m.idMurid,
        m.namaMurid,
        g.noTelf AS noTelfGuru,
        g.namaGuru,
        k.namaKelas,
        a.absensiMasuk,
        a.absensiPulang,
        l.tanggal,
        GROUP_CONCAT(COALESCE(n.nilai, 'Belum memiliki Nilai')) AS nilai
      FROM
        laporan l
        JOIN absensi a ON l.idAbsensi = a.idAbsensi
        JOIN murid m ON l.idMurid = m.idMurid
        JOIN orangtua o ON m.idOrtu = o.idOrtu
        LEFT JOIN nilai n ON l.idLaporan = n.idLaporan
        LEFT JOIN absensi ABS ON l.idAbsensi = abs.idAbsensi
        LEFT JOIN murid mur ON abs.idMurid = mur.idMurid
        LEFT JOIN kelas k ON mur.idKelas = k.idKelas
        LEFT JOIN guru g ON k.idGuru = g.idGuru
      WHERE
        o.noTelf = ?
      GROUP BY
        l.idLaporan, a.idAbsensi, m.idMurid, m.namaMurid, g.noTelf, g.namaGuru, k.namaKelas, a.absensiMasuk, a.absensiPulang, l.tanggal;
    `;

    const [rows] = await connection.promise().query(query, [from]);

    if (rows.length > 0) {
      rows.forEach((row, index) => {
        let reportText = '';

        const formattedDate = new Date(row.tanggal).toLocaleDateString('id-ID');
        const formattedTimeStart = new Date(row.absensiMasuk).toLocaleTimeString('id-ID');
        const formattedTimeEnd = row.absensiPulang
          ? new Date(row.absensiPulang).toLocaleTimeString('id-ID')
          : 'Belum absensi pulang';
          const idNilaiArray = row.idNilai ? row.idNilai.split(',') : [];
          const nilaiArray = row.nilai ? row.nilai.split(',') : [];          
        if (index === 0) {
          reportText += `LAPORAN ${row.namaMurid.toUpperCase()}\nWali kelas: ${row.namaGuru||'Kosong'} (${row.noTelfGuru||'Kosong'})\n\n`;
        } else {
          reportText += `\nLAPORAN ${row.namaMurid.toUpperCase()}\nWali kelas: ${row.namaGuru||'Kosong'} (${row.noTelfGuru||'Kosong'})\n\n`;
        }

        reportText += `${index + 1}. Tanggal: ${formattedDate}\n`;
        reportText += `   Absensi: ${formattedTimeStart} - ${formattedTimeEnd}\n`;
        reportText += '   Nilai:\n';
        if(idNilaiArray==0){
          reportText += '      (Masih belum mendapatkan nilai)'
        }else{
          idNilaiArray.forEach((idNilai, i) => {
            reportText += `      ${i + 1}. ${nilaiArray[i]}\n`;
          });
        }

        reportText += '\n';

        client.reply(from, reportText, id);
      });
    } else {
      client.reply(from, 'Data tidak ditemukan.', id);
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    await connection.end();
  }
};

const fetchMuridSorted = async () => {
  const connection = await mysql.createConnection({
    host: msgHandler.account.host,
    user: msgHandler.account.root,
    password : msgHandler.account.password,
    database: msgHandler.account.database
  });
  try {
    const [rows] = await connection.promise().query(`
    SELECT murid.idMurid, murid.namaMurid, murid.idKelas, kelas.namaKelas
    FROM murid
    LEFT JOIN kelas ON murid.idKelas = kelas.idKelas
    ORDER BY 
      ISNULL(murid.idKelas), 
      kelas.namaKelas,
      murid.namaMurid;
    
    `);
    if (rows.length > 0) {
      let resultText = '';
      rows.forEach((row, index) => {
        resultText += `${index + 1}. ${row.namaMurid} ${row.idKelas ? `'${row.namaKelas}'` : "'Kelas masih kosong'"}\n`;
      });
      return { text: resultText, rows: rows };
    } else {
      return { text: 'Data tidak ditemukan.', rows: [] };
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    await connection.end();
  }
};

module.exports = {
    absensiMurid,
    runQuery,
    fetchMuridSorted
}