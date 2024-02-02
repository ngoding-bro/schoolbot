const wa = require('@open-wa/wa-automate');
const {decryptMedia} = require('@open-wa/wa-decrypt')
const msgHandler = require('./Data/msgHandler')
const dbHandler = require('./Data/databaseHandler')
const fs = require('fs-extra')
const mysql = require('mysql2')
const jpeg = require('jpeg-js')
const jsQR = require('jsqr');
(async()=>{
    wa.create({
        sessionId: 'Indraw',
        qrTimeout: 0,
        authTimeout: 0,
        restartOnCrash: start,
        cacheEnabled: false,
        useChrome: true,
        killProcessOnBrowserClose: true,
        throwErrorOnTosBlock: false,
        chromiumArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--aggressive-cache-discard',
            '--disk-cache-size=0'
        ]
    }).then(client => start(client));
    function start(client){
        const useResponse = {}
        client.onMessage(async message => {
            const { body, id, from, mimetype, isMedia, type, caption } = message
            const bodys = caption||body||''
            client.sendSeen(from)
            console.log(bodys)
            const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
            if(useResponse[from]&&/\b(cancel|membatalkan|batal)\b/i.test(bodys)){
                client.reply(from, 'Sudah dibatalkan, silahkan kunjungi kami kembali', id)
                delete useResponse[from]
            }else{
                if(/\babsensi\b/i.test(bodys)){
                    if(isMedia && type == 'image'){
                        try{
                            const dataOnQrServer = 'qHstdhacaksxmeW239dsa'
                            const dataAbsensi = await decryptMedia(message, uaOverride)
                            const rawImageData = jpeg.decode(dataAbsensi,{useTArray:true})
                            const code = jsQR.default(rawImageData.data, rawImageData.width, rawImageData.height)
                            if (code) {
                                if(dataOnQrServer==code.data){
                                    client.reply(from, await dbHandler.absensiMurid(from), id)
                                }else{
                                    console.log('Error dari persamaan code')
                                }
                            } else {
                                client.reply(from, 'Maaf, QR Code tidak terdeteksi, mohon diulangi',id )
                            }
                        }catch(err){
                            console.error(err)
                        }
                    }
                }else if(/\bmengerjakan\s*tugas\b/i.test(bodys)){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    client.reply(from, 'Atas nama bapak/ibu guru siapa? (langsung sebut nama)', id)
                    const [[rows]] = await connection.promise().query('CALL dapatNoTelfMurid()');
                    if(rows.some(row => row.noTelf == from)){
                        useResponse[from] = {step:29}
                    }else{
                        client.reply(from, 'Maaf, kamu bukan peserta di SMPS Pagesangan Jaya', id)
                    }
                    connection.end()
                }
                else if(useResponse[from]&&useResponse[from].step==29){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    //Untuk zipnya berisi file index.js atau semua folder pak
                    const [[rows]] = await connection.promise().query('CALL mencariTugasByGuru(?)', [`%${body}%`]);
                    const [[results]] = await connection.promise().query('CALL ambilInfoMuridDanNilai()');
                    const nilaiData = results;
                    const muridStatus = {};
                    if (nilaiData.length > 0) {
                        nilaiData.forEach((data) => {
                            const idMurid = data.idMurid;
                            if (!muridStatus.hasOwnProperty(idMurid)) {
                                muridStatus[idMurid] = true;
                            }
                            if (data.idMurid == idMurid && idMurid === from) {
                                muridStatus[idMurid] = false;
                            }
                        })
                    }
                    if(muridStatus){
                        if(rows.length==1){
                            const isiSoalJson = JSON.parse(rows[0].isi)
                            useResponse[from] = {step:28,isi:isiSoalJson,idTugas:rows[0].idTugas}
                            client.reply(from, 'Baik, tugas sudah siap untuk dikerjakan, (TUGAS TIDAK BISA MENGULANG)\n\nApa kamu sudah siap?', id)
                        }else if(rows.length>1){
                            const namaGuruTeks = rows.map(row => row.namaGuru).join(', ');
                            client.reply(from, `Nama guru terdeteksi ada ${rows.length} yaitu ${namaGuruTeks}\nMohon pilih salah satu`,id)
                        }else{
                            client.reply(from, 'Maaf, guru yang kamu cari tidak tersedia atau tidak ada, mohon cek Informasi Guru', id)
                            delete useResponse[from]
                        }
                    }else{
                        client.reply(from, 'Kamu sudah pernah mengerjakan tugas ini, jadi mohon cari guru yang lain!', id)
                    }
                    connection.end()
                }
                else if((useResponse[from]&&useResponse[from].step==28)&&/\b(?:aku|saya)?\s*siap\b/i.test(body)){
                    client.reply(from, `Contoh penjawaban: "1. A"\n\n${msgHandler.formatTugasToText(useResponse[from].isi)}`, id)
                    useResponse[from] = {step : 27,isi:useResponse[from].isi,jawaban:[],idTugas:useResponse[from].idTugas}
                }
                else if((useResponse[from]&&useResponse[from].step==28)&&/\b(?:tidak|belum)?\s*siap\b/i.text(body)){
                    delete useResponse[from]
                    client.reply(from,'baiklah',id)
                }
                else if((useResponse[from]&&useResponse[from].step==27)){
                    if((useResponse[from].isi.length>useResponse[from].jawaban.length+1)){
                        useResponse[from].jawaban.push(msgHandler.parseAnswers(body))
                        console.log(useResponse[from].jawaban)
                        console.log(useResponse[from].isi)
                        useResponse[from] = {step:27,isi:useResponse[from].isi,jawaban:useResponse[from].jawaban,idTugas:useResponse[from].idTugas}
                        client.reply(from, 'jawaban sudah dikunci, lanjut!', id)
                    }else{
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        useResponse[from].jawaban.push(msgHandler.parseAnswers(body))
                        const nilai = msgHandler.hitungNilai(parseInt(msgHandler.hitungJawabanBenar(msgHandler.getKunciJawaban(useResponse[from].isi),useResponse[from].jawaban)),useResponse[from].isi.length,100)
                        await client.reply(from, `Selamat, kamu mendapatkan nilai ${nilai}/100`,id)
                        const [[results]] = await connection.promise().query(`CALL DapatkanIdMuridBerdasarkanNoTelf(?)`,[from]);
                        if (results.length > 0) {
                        await connection.promise().query(`CALL TambahNilaiTugasMurid(?, ?, ?)`,[nilai,useResponse[from].idTugas,results[0].idMurid]);
                        console.log('Data berhasil dimasukkan ke dalam tabel nilai');
                        }
                        connection.end()
                        delete useResponse[from]
                    }
                }
                else if(/^(buat|create|membuat)\s*tugas/i.test(bodys)) {
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const [[rows]] = await connection.promise().query('CALL AmbilInfoGuru()');
                    const noTelfGuru = rows.map(row => ({noTelf:row.noTelf,idGuru:row.idGuru,namaGuru:row.namaGuru}));
                    if (noTelfGuru.some(guru => guru.noTelf == from)) {
                        client.reply(from, 'Mohon untuk membuat soal dengan subjek seperti ini \n\n1. (Soal anda)\nA. (Jawaban A)\nB. (Jawaban B)\nC. (Jawaban C)\nD. (Jawaban D)\nJawaban : (Kata Kunci dari jawaban)\n\nContoh:\n1. Apa itu simbol garuda?\nA. Lambang negara\nB. Lambang keagungan\nC. Lambang kesejahteraan\nD. Lambang kemakmuran\nJawaban: A\n\nSoal bisa melebihi satu dengan subjek yang sama!', id);
                        useResponse[from] = { step: 23, idGuru: noTelfGuru.find(guru => guru.noTelf === from).idGuru, namaGuru: noTelfGuru.find(guru => guru.noTelf === from).namaGuru };
                    } else {
                        client.reply(from, 'Nomor telepon pengirim tidak terdaftar sebagai guru.', id);
                    }
                    connection.end()
                }//metode respon soal
                else if(useResponse[from]&&useResponse[from].step==23){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const jsonSoal = JSON.stringify(msgHandler.parseQuestionsInput(body))
                    const [result] = await connection.promise().query('CALL dapatNoTelfMurid()');
                    client.reply(from,`Ada tugas baru dari bapak/ibu ${useResponse[from].namaGuru}\nSilahkan dikerjakan!`, id)
                    const values = [useResponse[from].idGuru, jsonSoal];
                    await connection.promise().query('CALL TambahTugas(?,?)', values);
                    client.reply(from, 'Soal sudah selesai di upload', id)
                    connection.end()
                    delete useResponse[from]
                }else if(/\bmenambahkan\b.*\bdata\b/i.test(bodys)){ //step 1
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const [noTelf_operator] = await connection.promise().query('CALL AmbilDataOperatorByNoTelf(?)',[from])
                    if(noTelf_operator==1) return client.reply(from, 'Maaf, kamu tidak mempunyai hak akses untuk menambahkan data', id)
                    client.reply(from, 'Pilih untuk penambahan data (murid/guru/orangtua)', id)
                    useResponse[from] = {step:100}
                    connection.end()
                }//metode menambahkan data
                    else if(useResponse[from]&&useResponse[from].step==100){
                        if(/\bmurid\b/i.test(bodys)){
                            client.reply(from, 'Berapa nomor telephonenya?', id)
                            useResponse[from] = {step:101}
                        }else if(/\bguru\b/i.test(bodys)){
                            client.reply(from, 'Berapa nomor telephonenya?', id)
                            useResponse[from] = {step:112}
                        }else if(/\borang\s*tua\b/i.test(bodys)){
                            client.reply(from, 'Berapa nomor telephonenya?', id)
                            useResponse[from] = {step:120}
                        }else{
                            client.reply(from, 'Pilih salah satu diantaranya : murid, guru, orang tua', id)
                        }
                }//metode menambahkan data pilihan
                    else if(useResponse[from]&&useResponse[from].step==101){
                        const ubahStringNomor = `${msgHandler.ubahFormatNomor(bodys)}`
                        if(/\d{12}@c\.us/.test(ubahStringNomor)!=undefined){
                            useResponse[from] = { step : 102, noTelf: ubahStringNomor}
                            client.reply(from, 'Baik, nama panjangnya siapa?', id)
                        }else{
                            client.reply(from, 'Maaf, berikan nomornya langsung disini', id)
                        }
                }//metode menambahkan murid step 3
                    else if(useResponse[from]&&useResponse[from].step==102){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const results = await connection.promise().query('CALL AmbilDataMurid()')
                        if(msgHandler.isNamaExist(results, body, 'MURID')) {
                            client.reply(from, `Maaf, nama ${body} sudah terdaftar, silahkan ulangi namanya`, id)
                            useResponse[from] = { step: 102, noTelf: useResponse[from].noTelf}
                        }else{
                            client.reply(from, 'Untuk jenis kelaminnya?', id)
                            useResponse[from] = { step: 103, noTelf: useResponse[from].noTelf, nama: body}
                        }
                        connection.end()
                }//metode menambahkan murid step 4
                    else if(useResponse[from]&&useResponse[from].step==103){
                        if(msgHandler.ekstrakGender(body)){
                            client.reply(from, `Data yang akan dimasukkan \n\nNama : ${useResponse[from].nama}\nJenis Kelamin : ${msgHandler.ekstrakGender(body)}\nNo Telephone : ${useResponse[from].noTelf}\n\nApakah benar?`, id);
                            useResponse[from] = { step: 105, noTelf: useResponse[from].noTelf, nama: useResponse[from].nama, jenisKelamin: msgHandler.ekstrakGender(body)};
                        }else{
                            client.reply(from, `Ulangi untuk jenis kelaminnya tidak ada.`)
                        }
                }//metode menambahkan murid step akhir
                    else if(useResponse[from]&&useResponse[from].step==105){
                        if(msgHandler.dataValid(body)=='positif'){
                            const connection = mysql.createConnection({
                                host: msgHandler.account.host,
                                user: msgHandler.account.root,
                                password : msgHandler.account.password,
                                database: msgHandler.account.database
                            })
                            const [dataMurid] = await connection.promise().query('CALL AmbilDataMurid()')
                            const idMuridNew = msgHandler.mendapatkanIdDataBaru(dataMurid,"MURID")
                            const dataMuridArray = [idMuridNew, useResponse[from].nama,useResponse[from].jenisKelamin,useResponse[from].noTelf]
                            connection.query('CALL TambahDataMurid(?,?,?,?)',dataMuridArray,(err)=>{
                                if(err){
                                    console.log(err)
                                }
                            })
                            client.reply(from, `Data atas nama ${useResponse[from].nama} sudah masuk di database`, id)
                            delete useResponse[from]
                            connection.end()
                        }else if(msgHandler.dataValid(body)=='negatif'){
                            client.reply(from, 'Baiklah', id)
                            delete useResponse[from]
                        }else{
                            client.reply(from, 'Mohon beri tanggapan dengan jelas!', id)
                        }
                    }//menambahkan guru baru
                        else if(useResponse[from]&&useResponse[from].step==112){
                            const ubahStringNomor = `${msgHandler.ubahFormatNomor(bodys)}`
                            if(/\d{12}@c\.us/.test(ubahStringNomor)!=undefined){
                                useResponse[from] = { step : 113, noTelf: ubahStringNomor}
                                client.reply(from, 'Baik, nama panjangnya siapa? (beserta gelar)', id)
                            }else{
                                client.reply(from, 'Maaf, berikan nomornya langsung disini', id)
                            }
                    }//menambahkan guru baru
                        else if(useResponse[from]&&useResponse[from].step==113){
                            const connection = mysql.createConnection({
                                host: msgHandler.account.host,
                                user: msgHandler.account.root,
                                password : msgHandler.account.password,
                                database: msgHandler.account.database
                            })
                            const [results] = await connection.promise().query('CALL AmbilSemuaDataGuru()')
                            if(msgHandler.isNamaExist(results, body, 'GURU')) {
                                client.reply(from, `Maaf, nama ${body} sudah terdaftar, silahkan ulangi namanya`, id)
                                useResponse[from] = { step: 113, noTelf: useResponse[from].noTelf}
                            }else{
                                client.reply(from, 'Untuk jenis kelaminnya?', id)
                                useResponse[from] = { step: 114, noTelf: useResponse[from].noTelf, nama: body}
                            }
                            connection.end()
                    }//menambahkan guru baru
                        else if(useResponse[from]&&useResponse[from].step==114){
                            if(msgHandler.ekstrakGender(body)){
                                client.reply(from, `Data Guru yang akan dimasukkan \n\nNama : ${useResponse[from].nama}\nJenis Kelamin : ${msgHandler.ekstrakGender(body)}\nNo Telephone : ${useResponse[from].noTelf}\n\nApakah benar?`, id);
                                useResponse[from] = { step: 115, noTelf: useResponse[from].noTelf, nama: useResponse[from].nama, jenisKelamin: msgHandler.ekstrakGender(body)};
                            }else{
                                client.reply(from, `Ulangi untuk jenis kelaminnya tidak ada.`)
                            }
                    }//menambahkan guru baru
                        else if(useResponse[from]&&useResponse[from].step==115){
                            if(msgHandler.dataValid(body)=='positif'){
                                const connection = mysql.createConnection({
                                    host: msgHandler.account.host,
                                    user: msgHandler.account.root,
                                    password : msgHandler.account.password,
                                    database: msgHandler.account.database
                                })
                                const [dataSemuaGuru] = await connection.promise().query('CALL AmbilSemuaDataGuru()')
                                const idDataNew = msgHandler.mendapatkanIdDataBaru(dataSemuaGuru,"GURU")
                                const dataArray = [idDataNew, useResponse[from].nama,useResponse[from].jenisKelamin,useResponse[from].noTelf]
                                connection.query('CALL TambahDataGuru(?,?,?,?)',dataArray,(err)=>{
                                    if(err){
                                        console.log(err)
                                    }
                                })
                                client.reply(from, `Data atas nama ${useResponse[from].nama} sudah masuk di database`, id)
                                delete useResponse[from]
                                connection.end()
                            }else if(msgHandler.dataValid(body)=='negatif'){
                                client.reply(from, 'Baiklah', id)
                                delete useResponse[from]
                            }else{
                                client.reply(from, 'Mohon beri tanggapan dengan jelas!', id)
                            }
                    }//menambahkan ortu baru
                    else if(useResponse[from]&&useResponse[from].step==120){
                        const ubahStringNomor = `${msgHandler.ubahFormatNomor(bodys)}`
                        if(/\d{12}@c\.us/.test(ubahStringNomor)!=undefined){
                            useResponse[from] = { step : 121, noTelf: ubahStringNomor}
                            client.reply(from, 'Baik, nama panjangnya siapa?', id)
                        }else{
                            client.reply(from, 'Maaf, berikan nomornya langsung disini', id)
                        }
                    }//menambahkan ortu baru
                        else if(useResponse[from]&&useResponse[from].step==121){
                            const connection = mysql.createConnection({
                                host: msgHandler.account.host,
                                user: msgHandler.account.root,
                                password : msgHandler.account.password,
                                database: msgHandler.account.database
                            })
                            const [results] = await connection.promise().query('CALL AmbilSemuaDataOrangTua()')
                            if(msgHandler.isNamaExist(results, body, 'ORANG TUA')) {
                                client.reply(from, `Maaf, nama ${body} sudah terdaftar, silahkan ulangi namanya`, id)
                                useResponse[from] = { step: 121, noTelf: useResponse[from].noTelf}
                            }else{
                                client.reply(from, 'Sebutkan nama putra/putrinya! (wajib nama lengkap)', id)
                                useResponse[from] = {step: 122, noTelf: useResponse[from].noTelf, nama: msgHandler.capitalizeName(bodys)}
                            }
                            connection.end()
                        }
                        else if(useResponse[from]&&useResponse[from].step==122){
                            const connection = mysql.createConnection({
                                host: msgHandler.account.host,
                                user: msgHandler.account.root,
                                password : msgHandler.account.password,
                                database: msgHandler.account.database
                            })
                            const [[results]] = await connection.promise().query('CALL AmbilInfoMuridTanpaOrtuDenganNama(?)',[bodys])
                            if(results.length==0) {
                                client.reply(from, 'Maaf, nama yang kamu cari tidak berhasil untuk kami temukan atau mungkin nama kurang spesifik, mohon ulangi', id)
                                delete useResponse[from]
                            }
                            client.reply(from, `Data Orang tua yang akan dimasukkan \n\nNama : ${useResponse[from].nama}\nNo Telephone : ${useResponse[from].noTelf}\nOrang tua dari ${msgHandler.genderKey(results[0].jenisKelamin)} ${results[0].namaMurid}\n\nApakah benar?`, id);
                            useResponse[from] = {step: 123, noTelf: useResponse[from].noTelf, nama: useResponse[from].nama, idMurid: results[0].idMurid}
                            connection.end()
                    }//menambahkan ortu baru
                        else if(useResponse[from]&&useResponse[from].step==123){
                            if(msgHandler.dataValid(body)=='positif'){
                                const connection = mysql.createConnection({
                                    host: msgHandler.account.host,
                                    user: msgHandler.account.root,
                                    password : msgHandler.account.password,
                                    database: msgHandler.account.database
                                })
                                const [getAllOperator] = await connection.promise().query('CALL AmbilInfoOrangTua()')
                                var idDataBaru
                                if(getAllOperator[0].length>0){
                                    console.log(getAllOperator)
                                    idDataBaru = msgHandler.mendapatkanIdDataBaru(getAllOperator,'ORANG TUA')
                                }else{
                                    idDataBaru = 1
                                }
                                const dataArray = [idDataBaru, useResponse[from].nama,useResponse[from].noTelf]
                                await connection.promise().query('CALL TambahDataOrangTua(?,?,?)',dataArray)
                                await connection.promise().query('CALL PerbaruiIdOrtuMurid(?,?)',[idDataBaru,useResponse[from].idMurid])
                                client.reply(from, `Data atas nama ${useResponse[from].nama} sudah masuk di database`, id)
                                delete useResponse[from]
                                connection.end()
                            }else if(msgHandler.dataValid(body)=='negatif'){
                                client.reply(from, 'Baiklah', id)
                                delete useResponse[from]
                            }else{
                                client.reply(from, 'Mohon beri tanggapan dengan jelas!', id)
                            }
                    }else if(/membuat kelas/i.test(bodys)){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const [[results]] = await connection.promise().query('CALL AmbilDataOperatorByNoTelf(?)', [from]);
                        if (results==1) return client.reply(from, 'Maaf, kamu bukanlah operator', id)
                        client.reply(from, 'Baik, untuk nama kelasnya? (wajib mengisikan kelas lengkap)', id)
                        useResponse[from] = {step:130}
                        connection.end()
                    }else if(useResponse[from]&&useResponse[from].step==130){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const filter = msgHandler.kelasFilter(body)
                        const [[results]] = await connection.promise().query('CALL AmbilDataKelasBerdasarkanNama(?)',[filter])
                        if(filter){
                            if(results.length>0){
                                client.reply(from, 'Maaf, nama kelas sudah terdaftar', id)
                            }else{
                                const [rows] = await connection.promise().query(`CALL AmbilGuruTanpaKelas()`);
                                if (rows.length > 0) {
                                    const [[results1]] = await connection.promise().query('CALL AmbilSemuaDataGuru()');
                                    const dataGuruFull = results1.map(row => {
                                        return {
                                            idGuru: row.idGuru,
                                            namaGuru: row.namaGuru
                                        };
                                    });
                                    const [[results2]] = await connection.promise().query('CALL AmbilSemuaIdGuruDariKelas()');
                                    const idGuruKelas = results2.map(row => row.idGuru);
                                    const guruBelumTerdaftar = dataGuruFull.filter(guru => !idGuruKelas.includes(guru.idGuru));
                                    const dataGuruText = guruBelumTerdaftar.map((guru, index) => `(${index + 1}) ${guru.namaGuru}`).join('\n');
                                    client.reply(from, `Baik, pilih nama Wali Kelasnya dengan memilih dan menjawab angka yang ada di kiri\ncontoh : 1\n\n${dataGuruText}`, id)
                                    useResponse[from] = {step:131,dataGuru:guruBelumTerdaftar,namaKelas:filter}
                                } else {
                                    client.reply(from, 'Semua wali kelas sudah terisi didalam kelas, jadi mohon untuk menambahkan guru dengan kelas yang wali kelasnya masih kosong', id)
                                    delete useResponse[from]
                                }
                            }
                        }else{
                            client.reply(from, `Maaf, kelas yang kamu masukkan salah, mohon ulangi!`, id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==131){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const pilihanIndex = parseInt(body);
                        if (!isNaN(pilihanIndex) && pilihanIndex > 0 && pilihanIndex <= useResponse[from].dataGuru.length) {
                            const data = [useResponse[from].namaKelas,useResponse[from].dataGuru[pilihanIndex - 1].idGuru];
                            await connection.promise().query('CALL TambahDataKelas(?,?)',data)
                            client.reply(from, 'Data sudah masuk ke dalam kelas', id)
                            delete useResponse[from]
                        } else {
                            client.reply(from, "Input tidak valid atau di luar rentang.", id);
                        }
                        connection.end()
                    }
                    else if(/\bmenghapus data\b/gi.test(bodys)){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const [noTelf_operator] = await connection.promise().query('CALL AmbilDataOperatorByNoTelf(?);',[from])
                        if(noTelf_operator==1) return client.reply(from, 'Maaf, kamu tidak mempunyai hak akses untuk menghapus data', id)
                        client.reply(from, 'Pilih untuk penghapusan data (murid/guru/orangtua)', id)
                        useResponse[from] = {step:170}
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==170){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        if(/\bmurid\b/i.test(bodys)){
                            const [[dataMurid]] = await connection.promise().query('CALL AmbilInfoMurid()')
                            const formattedText = dataMurid.map((murid, index) => `${index + 1}. ${murid.namaMurid}`).join('\n');
                            if(dataMurid.length>0){
                                client.reply(from, `Mohon pilihlah salah satu yang ingin dihapus dengan menggunakan angka\nContoh : 1\n\n${formattedText}`, id)
                                useResponse[from] = {step:180,dataMurid:dataMurid}
                            }else{
                                client.reply(from, "Maaf, murid kosong mohon untuk cek Informasi Murid", id)
                                delete useResponse[from]
                            }
                        }else if(/\bguru\b/i.test(bodys)){
                            const [[dataGuru]] = await connection.promise().query('CALL AmbilInfoGuru()')
                            const formattedText = dataGuru.map((guru, index) => `${index + 1}. ${guru.namaGuru}`).join('\n');
                            if(dataGuru.length>0){
                                client.reply(from, `Mohon pilihlah salah satu yang ingin dihapus dengan menggunakan angka\nContoh : 1\n\n${formattedText}`, id)
                                useResponse[from] = {step:171,dataGuru:dataGuru}
                            }else{
                                client.reply(from, "Maaf, guru kosong mohon untuk cek Informasi Guru", id)
                                delete useResponse[from]
                            }
                        }else if(/\borang\s*tua\b/i.test(bodys)){
                            const [[dataOrtu]] = await connection.promise().query('CALL AmbilInfoOrangtua()')
                            const formattedText = dataOrtu.map((orangtua, index) => `${index + 1}. ${orangtua.namaOrtu}`).join('\n');
                            if(dataOrtu.length>0){
                                client.reply(from, `Mohon pilihlah salah satu yang ingin dihapus dengan menggunakan angka\nContoh : 1\n\n${formattedText}`, id)
                                useResponse[from] = {step:221,dataOrtu:dataOrtu}
                            }else{
                                client.reply(from, "Maaf, data ortu kosong mohon untuk cek Informasi Guru", id)
                                delete useResponse[from]
                            }
                        }else{
                            client.reply(from, 'Maaf, pilihlah salah satu dari (murid & guru), lalu kirim pesan disini', id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==171){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const pilihanIndex = parseInt(body);
                        if (!isNaN(pilihanIndex) && pilihanIndex > 0 && pilihanIndex <= useResponse[from].dataGuru.length) {
                            const data = [useResponse[from].dataGuru[pilihanIndex-1].idGuru];
                            
                            await connection.promise().query('CALL HapusDataGuru(?)',data)
                            client.reply(from, 'Data sudah dihapus', id)
                            delete useResponse[from]
                        } else {
                            console.log("Input tidak valid atau di luar rentang.");
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==180){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const pilihanIndex = parseInt(body);
                        if (!isNaN(pilihanIndex) && pilihanIndex > 0 && pilihanIndex <= useResponse[from].dataMurid.length) {
                            const data = [useResponse[from].dataMurid[pilihanIndex-1].idMurid];
                            await connection.promise().query('CALL HapusDataMurid(?)',data)
                            client.reply(from, 'Data sudah dihapus', id)
                            delete useResponse[from]
                        } else {
                            console.log("Input tidak valid atau di luar rentang.");
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==221){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const pilihanIndex = parseInt(body);
                        if (!isNaN(pilihanIndex) && pilihanIndex > 0 && pilihanIndex <= useResponse[from].dataOrtu.length) {
                            const data = [useResponse[from].dataOrtu[pilihanIndex-1].idOrtu];
                            await connection.promise().query('CALL HapusOrangtua(?)',data)
                            client.reply(from, 'Data sudah dihapus', id)
                            delete useResponse[from]
                        } else {
                            console.log("Input tidak valid atau di luar rentang.");
                        }
                        connection.end()
                    }
                    else if(/mengupdate data/i.test(bodys)){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const [noTelf_operator] = await connection.promise().query('CALL AmbilDataOperatorByNoTelf(?);',[from])
                        if(noTelf_operator==1) return client.reply(from, 'Maaf, kamu tidak mempunyai hak akses untuk mengupdate data', id)
                        client.reply(from, 'Pilih untuk pengupdatean data (murid/guru/orangtua)', id)
                        useResponse[from] = {step:190}
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==190){
                        client.reply(from, 'Siapa namanya? (Wajib nama lengkap)', id)
                        if(/\bmurid\b/i.test(bodys)){
                            useResponse[from] = {step:191}
                        }else if(/\bguru\b/i.test(bodys)){
                            useResponse[from] = {step:200}
                        }else if(/\borang\s*tua\b/i.test(bodys)){
                            useResponse[from] = {step:210}
                        }
                    }
                    else if(useResponse[from]&&useResponse[from].step==191){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const [[results]] = await connection.promise().query('CALL AmbilIdMuridDariNamaMurid(?)',[body])
                        if(results.length>0){
                            client.reply(from, 'Apa yang ingin kamu update? (pilih angka)\nContoh : 1\n\n1. No Telephone\n2. Nama\n3. Jenis Kelamin',id)
                            useResponse[from] = {step:192, idMurid:results[0].idMurid}
                        }else{
                            client.reply(from, 'Maaf, data yang kamu cari tidak ada', id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==192){
                        const pilihanIndex = parseInt(body);
                        if (!isNaN(pilihanIndex) && pilihanIndex == 1) {
                            client.reply(from, 'Baiklah, berapa nomor telephone yang ingin diganti?', id)
                            useResponse[from] = {step:193, idMurid:useResponse[from].idMurid}
                        }else if(!isNaN(pilihanIndex) && pilihanIndex == 2) {
                            client.reply(from, 'Baiklah, kirimkan nama barunya! (Wajib nama lengkap)', id)
                            useResponse[from] = {step:194, idMurid:useResponse[from].idMurid}
                        }else if(!isNaN(pilihanIndex) && pilihanIndex == 3) {
                            client.reply(from, 'Baiklah, sebutkan jenis kelaminnya! (Laki-laki atau Perempuan)', id)
                            useResponse[from] = {step:195, idMurid:useResponse[from].idMurid}
                        }else{
                            client.reply(from, "Input tidak valid atau di luar rentang.", id);
                        }
                    }
                    else if(useResponse[from]&&useResponse[from].step==193){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const ubahStringNomor = `${msgHandler.ubahFormatNomor(bodys)}`
                        if(/\d{12}@c\.us/.test(ubahStringNomor)!=undefined){
                            await connection.promise().query('CALL PerbaruiNoTelfMurid(?,?)',[msgHandler.ubahFormatNomor(bodys),useResponse[from].idMurid]);
                            client.reply(from, 'Data Nomor Telephone murid sudah diganti', id)
                            delete useResponse[from]
                        }else{
                            client.reply(from, 'Mohon ulangi nomor, nomor tidak valid', id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==194){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        await connection.promise().query('CALL PerbaruiNamaMurid(?,?)',[msgHandler.capitalizeName(bodys),useResponse[from].idMurid])
                        client.reply(from, `Nama baru ${msgHandler.capitalizeName(bodys)} telah diganti pada data murid`,id)
                        delete useResponse[from]
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==195) {
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        if(msgHandler.ekstrakGender(bodys)){
                            await connection.promise().query('CALL PerbaruiJenisKelaminMurid(?,?)',[msgHandler.ekstrakGender(bodys),useResponse[from].idMurid])
                            client.reply(from, 'Jenis kelamin telah diganti!', id)
                            delete useResponse[from]
                        }else{
                            client.reply(from, 'Maaf, pesan yang kamu kirim salah, contoh : Laki-laki / Perempuan',id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==200){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const [[results]] = await connection.promise().query('CALL CariIdGuruDariNamaGuru(?)',[bodys])
                        if(results.length==1){
                            client.reply(from, 'Apa yang ingin kamu update? (pilih angka)\nContoh : 1\n\n1. No Telephone\n2. Nama',id)
                            useResponse[from] = {step:201, idGuru:results[0].idGuru}
                        }else{
                            client.reply(from, 'Maaf, data yang kamu cari tidak ada', id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==201){
                        const pilihanIndex = parseInt(body);
                        if (!isNaN(pilihanIndex) && pilihanIndex == 1) {
                            client.reply(from, 'Baiklah, berapa nomor telephone yang ingin diganti?', id)
                            useResponse[from] = {step:202, idGuru:useResponse[from].idGuru}
                        }else if(!isNaN(pilihanIndex) && pilihanIndex == 2) {
                            client.reply(from, 'Baiklah, kirimkan nama barunya! (Wajib nama lengkap)', id)
                            useResponse[from] = {step:203, idGuru:useResponse[from].idGuru}
                        }else{
                            client.reply(from, "Input tidak valid atau di luar rentang.", id);
                        }
                    }
                    else if(useResponse[from]&&useResponse[from].step==202){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const ubahStringNomor = `${msgHandler.ubahFormatNomor(bodys)}`
                        if(/\d{12}@c\.us/.test(ubahStringNomor)!=undefined){
                            await connection.promise().query('CALL PerbaruiNoTelfGuru(?,?)',[msgHandler.ubahFormatNomor(bodys),useResponse[from].idGuru]);
                            client.reply(from, 'Data Nomor Telephone guru sudah diganti', id)
                            delete useResponse[from]
                        }else{
                            client.reply(from, 'Mohon ulangi nomor, nomor tidak valid', id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==203){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        await connection.promise().query('CALL PerbaruiNamaGuru(?,?)',[msgHandler.capitalizeName(bodys),useResponse[from].idGuru])
                        client.reply(from, `Nama baru ${msgHandler.capitalizeName(bodys)} telah diganti pada data guru`,id)
                        delete useResponse[from]
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==210){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const [[results]] = await connection.promise().query('CALL CariIdOrtuDariNamaOrtu(?)',[bodys])
                        if(results.length==1){
                            client.reply(from, 'Apa yang ingin kamu update? (pilih angka)\nContoh : 1\n\n1. No Telephone\n2. Nama',id)
                            useResponse[from] = {step:211, idOrtu:results[0].idOrtu}
                        }else{
                            client.reply(from, 'Maaf, data yang kamu cari tidak ada', id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==211){
                        const pilihanIndex = parseInt(body);
                        if (!isNaN(pilihanIndex) && pilihanIndex == 1) {
                            client.reply(from, 'Baiklah, berapa nomor telephone yang ingin diganti?', id)
                            useResponse[from] = {step:212, idOrtu:useResponse[from].idOrtu}
                        }else if(!isNaN(pilihanIndex) && pilihanIndex == 2) {
                            client.reply(from, 'Baiklah, kirimkan nama barunya! (Wajib nama lengkap)', id)
                            useResponse[from] = {step:213, idOrtu:useResponse[from].idOrtu}
                        }else{
                            client.reply(from, "Input tidak valid atau di luar rentang.", id);
                        }
                    }
                    else if(useResponse[from]&&useResponse[from].step==212){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const ubahStringNomor = `${msgHandler.ubahFormatNomor(bodys)}`
                        if(/\d{12}@c\.us/.test(ubahStringNomor)!=undefined){
                            await connection.promise().query('CALL PerbaruiNoTelfOrangTua(?,?)',[msgHandler.ubahFormatNomor(bodys),useResponse[from].idOrtu]);
                            client.reply(from, 'Data Nomor Telephone orang tua sudah diganti', id)
                            delete useResponse[from]
                        }else{
                            client.reply(from, 'Mohon ulangi nomor, nomor tidak valid', id)
                        }
                        connection.end()
                    }
                    else if(useResponse[from]&&useResponse[from].step==213){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        await connection.promise().query('CALL PerbaruiNamaOrtu(?,?)',[msgHandler.capitalizeName(bodys),useResponse[from].idOrtu])
                        client.reply(from, `Nama baru ${msgHandler.capitalizeName(bodys)} telah diganti pada data orang tua`,id)
                        delete useResponse[from]
                        connection.end()
                    }
                    else if(/\bmenghapus tugas\b|\bHapus pekerjaan\b|\bTugas dibatalkan\b|\bTugas selesai\b/.test(bodys)){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        const [[results]] = await connection.promise().query('CALL AmbilInfoTugasDanNoTelfGuru(?)',[from])
                        if(results.length>0){
                            client.reply(from, 'Apakah yakin kamu ingin menghapusnya?', id)
                            useResponse[from] = {step:139, idTugas: results[0].idTugas}
                        }else{
                            client.reply(from, 'Maaf, anda tidak mempunyai tugas/guru', id)
                        }
                        connection.end()               
                    }else if(useResponse[from]&&useResponse[from].step==139){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database
                        })
                        if(msgHandler.dataValid(body)=='positif'){
                            await connection.promise().query('CALL HapusTugas(?)',[useResponse[from].idTugas])
                            client.reply(from, 'Data Tugas anda berhasil kami hapus', id)
                            delete useResponse[from]
                        }else if(msgHandler.dataValid(body)=='negatif'){
                            client.reply(from, 'Baiklah', id)
                            delete useResponse[from]
                        }else{
                            client.reply(from, 'Jawaban tidak relavan', id)
                        }
                        connection.end()
                    }
                    else if(/^informasi\s+kelas$/.test(bodys)){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database,
                        });
                            connection.query('CALL AmbilInfoKelasMuridGuru()', (err, [results]) => {
                            if (err) {
                                console.error('Error executing query:', err);
                                return;
                            }
                            if (results.length === 0) {
                                client.reply(from, 'Data kelas masih kosong', id);
                            } else {
                                results.forEach((row) => {
                                    let replyText = `Kelas: ${row.namaKelas}, Wali kelas: ${row.namaGuru || "Masih kosong"}`;
                                    if (row.namaMurid) {
                                        const muridArray = row.namaMurid.split(',');
                                        if (muridArray.length > 0) {
                                            replyText += '\nMurid:';
                                            muridArray.forEach((murid, index) => {
                                                replyText += `\n${index + 1}. ${murid.trim()}`; // trim() untuk menghilangkan spasi di awal atau akhir
                                            });
                                        } else {
                                            replyText += '\nMurid: Masih kosong';
                                        }
                                    } else {
                                        replyText += '\nMurid: Masih kosong';
                                    }
                                    client.reply(from, replyText, id);
                                });
                            }                                      
                        }) 
                            connection.end();
                    }
                    else if(/^informasi\s+guru$/.test(bodys)){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database,
                        });
                        connection.query('CALL AmbilInfoGuru()', (err, [results]) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            return;
                        }
                        if (results.length === 0) {
                            client.reply(from, 'Data guru masih kosong', id);
                        } else {
                            results.forEach((row, index) => {
                            const localPhoneNumber = row.noTelf.replace(/@c\.us$/, '');
                            const jenisKelaminValues = row.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki';
                            const formattedPhoneNumber = localPhoneNumber.startsWith('62') ? '0' + localPhoneNumber.substring(2) : localPhoneNumber;
                            const responseText = `${index + 1}. ${row.namaGuru}, ${jenisKelaminValues}\n${formattedPhoneNumber}`;
                            client.reply(from, responseText, id);
                            });
                        }

                        connection.end();
                        });
                    }
                    else if(/^informasi\s+murid$/.test(bodys)){
                        const connection = mysql.createConnection({
                            host: msgHandler.account.host,
                            user: msgHandler.account.root,
                            password : msgHandler.account.password,
                            database: msgHandler.account.database,
                        });
                        connection.query('CALL AmbilInfoMuridDanKelas()', (err, [resultsMurid]) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            return;
                        }

                        if (resultsMurid.length === 0) {
                            client.reply(from, 'Data murid masih kosong', id);
                        } else {
                            var responseTextMurid = ''
                            resultsMurid.forEach((rowMurid, index) => {
                            const localPhoneNumberMurid = rowMurid.noTelf.replace(/@c\.us$/, '');
                            const formattedPhoneNumberMurid = localPhoneNumberMurid.startsWith('62') ? '0' + localPhoneNumberMurid.substring(2) : localPhoneNumberMurid;
                            const jenisKelaminValues = rowMurid.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki';
                            const namaKelasMurid = rowMurid.idKelas ? rowMurid.namaKelas : 'Belum gabung kelas';
                            responseTextMurid += `${index + 1}. ${rowMurid.namaMurid}, ${jenisKelaminValues}\n${formattedPhoneNumberMurid}\nID Kelas: ${namaKelasMurid}\n\n`;
                            });
                            client.reply(from, responseTextMurid, id);
                        }
                        connection.end();
                        });
                    }
                    else if(/^(menu|fitur|list|help|tolong|instruksi|informasi)$/i.test(bodys)){
                        const list = `☾ Menu Fitur ☽
    *Fitur khusus Murid*
    > Absensi
    - Digunakan untuk absensi para siswa (Wajib harus datang ke sekolah untuk scan qr)
    > Mengerjakan tugas
    - Digunakan untuk mengerjakan tugas

    *Fitur khusus Guru*
    > Membuat Tugas
    - Digunakan untuk membuat tugas
    > Menghapus Tugas
    - Digunakan untuk menghapus tugas

    *Fitur khusus Operator*
    > Menambahkan data
    contoh : menambahkan data
    - Digunakan untuk membuat data murid, guru, orang tua
    > Menghapus data
    contoh : menghapus data
    - Digunakan untuk menghapus data murid, guru
    > Membuat kelas
    contoh : membuat kelas
    - Digunakan untuk membuat kelas baru
    > Mengatur kelas
    contoh : mengatur kelas
    - Digunakan untuk mengatur kelas
    > Mengupdate data
    contoh : mengupdate data
    - Digunakan untuk update data murid, guru, orang tua

    *Fitur khusus Wali Murid*
    > Melihat laporan
    contoh : melihat laporan
    - Digunakan untuk melihat laporan wali Murid

    *Fitur umum*
    > Membatalkan
    contoh : cancel
    - Digunakan untuk membatalkan konfirmasi
    > Informasi
    contoh : informasi
    - Digunakan untuk melihat semua informasi menu
    > Informasi kelas
    contoh : informasi kelas
    - Digunakan untuk melihat semua informasi kelas
    > Informasi guru
    contoh : informasi guru
    - Digunakan untuk melihat semua informasi guru
    > Informasi murid
    contoh : informasi murid
    - Digunakan untuk melihat semua informasi murid`
                        client.reply(from, list, id)
                    }
                else if(/melihat laporan/i.test(bodys)){
                    const connection = mysql.createConnection({
                                host: msgHandler.account.host,
                                user: msgHandler.account.root,
                                password : msgHandler.account.password,
                                database: msgHandler.account.database
                            })
                    const [[results]] = await connection.promise().query('CALL AmbilInfoOrangTuaBerdasarkanNoTelf(?)',[from])
                    if(results.length == 1){
                        await client.reply(from, await dbHandler.runQuery(client, from, id), id)
                    }else{
                        client.reply(from, 'Maaf, fitur ini khusus hanya fitur untuk Wali Murid', id)
                    }
                    connection.end()
                }else if(/mengatur kelas/i.test(bodys)){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const [noTelf_operator] = await connection.promise().query('CALL AmbilDataOperatorByNoTelf(?);',[from])
                    if(noTelf_operator==1) return client.reply(from, 'Maaf, kamu tidak mempunyai hak akses untuk mengatur kelas', id)
                    client.reply(from, 'Sebutkan nama kelas yang ingin kamu atur\nContoh : 7A',id)
                    useResponse[from] = {step:250}
                    connection.end()
                }
                else if(useResponse[from]&&useResponse[from].step==250){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const [[rows]] = await connection.promise().query('CALL DapatkanIdKelasBerdasarkanNama(?)', [msgHandler.kelasFilter(bodys)]);
                    if(rows.length>0){
                        client.reply(from, 'Apa yang ingin kamu atur dikelas ini? (kirim pesan dengan angka)\nContoh : 1\n\n1. Menambah murid\n2. Merubah wali kelas\n3. Merubah nama kelas\n4. Menghapus kelas\n5. Menghapus murid',id)
                        useResponse[from] = {step:251,idKelas:rows[0].idKelas}
                    } else {
                        client.reply(from, 'Dimohon untuk menambahkan kelas terlebih dahulu, karena kelas masih kosong, atau cek Informasi kelas', id);
                        delete useResponse[from]
                    }
                    connection.end()
                }
                else if(useResponse[from]&&useResponse[from].step==251){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const pilihanIndex = parseInt(body);
                    if (!isNaN(pilihanIndex) && pilihanIndex == 1) {
                        const dataMuridNambah = await dbHandler.fetchMuridSorted()
                        if(dataMuridNambah){
                            client.reply(from, `Pilih salah satu dengan mengirimkan pesan angka, jika ingin memilih 1 maka kirim 1, atau jika ingin lebih dari 1 maka kirim sesuai yang dipilih\nContoh : 1 (jika memilih 1 nama) || 1,2,3 (jika memilih lebih dari 1 nama, sesuaikan angkanya)\n\n${dataMuridNambah.text}`, id)
                            useResponse[from] = {step:252,idKelas:useResponse[from].idKelas,dataMurid:dataMuridNambah.rows}
                        }else{
                            client.reply(from, 'Maaf, tidak ada murid satupun untuk dimasukkan ke kelas, mohon untuk menambahkan murid terlebih dahulu', id)
                            delete useResponse[from]
                        }
                    }else if(!isNaN(pilihanIndex) && pilihanIndex == 2){
                        client.reply(from, 'Mau diganti dengan nama guru siapa? (Wajib nama lengkap ya!)', id)
                        useResponse[from] = {step:253,idKelas:useResponse[from].idKelas}
                    }else if(!isNaN(pilihanIndex) && pilihanIndex == 3){
                        client.reply(from, 'Mau merubah nama kelas apa? (wajib nama kelas lengkap!)\nContoh : 7a', id)
                        useResponse[from] = {step:254,idKelas:useResponse[from].idKelas}
                    }else if(!isNaN(pilihanIndex) && pilihanIndex == 4){
                        client.reply(from, 'Yakin ingin menghapus kelas ini? (iya/tidak)', id)
                        useResponse[from] = {step:255,idKelas:useResponse[from].idKelas}
                    }else if(!iaNan(pilihanIndex) && pilihanIndex == 5){
                        const [[dataMurid]] = await connection.promise().query('CALL AmbilInfoMuridBerdasarkanKelas(?)'[useResponse[from].idKelas])
                        let teks = `Pilih salah satu dengan mengirimkan pesan angka, jika ingin memilih 1 maka kirim 1, atau jika ingin lebih dari 1 maka kirim sesuai yang dipilih\nContoh : 1 (jika memilih 1 nama) || 1,2,3 (jika memilih lebih dari 1 nama, sesuaikan angkanya)\n\n`
                        dataMurid.forEach((murid, index) => {
                            teks += `${index + 1}. ${murid.namaMurid}\n`;
                        });
                        client.reply(from, teks, id)
                        useResponse[from] = {step:256,idKelas:useResponse[from].idKelas,dataMurid:dataMurid}
                    }else{
                        client.reply(from, 'Mohon ulangi dengan menyebut angka yang sudah dijelaskan\n\n1. Menambah murid\n2. Merubah wali kelas\n3. Merubah nama kelas\n4. Menghapus kelas',id)
                    }
                    connection.end()
                }else if(useResponse[from]&&useResponse[from].step==252){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const indices = body.split(',').map(index => parseInt(index.trim()));
                    if (indices.some(isNaN)) {
                        return client.reply(from, 'Maaf ulangi, Pilih salah satu dengan mengirimkan pesan angka, jika ingin memilih 1 maka kirim 1, atau jika ingin lebih dari 1 maka kirim sesuai yang dipilih\nContoh : 1 (jika memilih 1 nama) || 1,2,3 (jika memilih lebih dari 1 nama, sesuaikan angkanya)', id)
                    }
                    const resultData = indices.map(index => useResponse[from].dataMurid[index-1]);
                    for (const data of resultData) {
                        const { idMurid} = data;
                        await connection.promise().query('CALL PerbaruiIdKelasMurid(?,?)', [useResponse[from].idKelas, idMurid]);
                    }
                    client.reply(from, 'Data baru sudah dimasukkan ke database', id)
                    delete useResponse[from]
                    connection.end()
                }else if(useResponse[from]&&useResponse[from].step==253){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const [[rows]] = await connection.promise().query('CALL CariGuruBerdasarkanNama(?)', [bodys]);
                    if(rows.length==1){
                        await connection.promise().query('CALL PerbaruiIdGuruKelas(?,?)',[rows[0].idGuru,useResponse[from].idKelas])
                        client.reply(from,`Kelas sudah berganti guru baru dengan nama ${rows[0].namaGuru}`,id)
                        delete useResponse[from]
                    }else if(rows.length>1){
                        client.reply(from, 'Guru yang kamu pilih memiliki lebih dari 1 pilihan, mohon untuk mengulangi lagi!', id)
                    }else{
                        client.reply(from, 'Guru tidak ditemukan', id)
                    }
                    connection.end()
                }
                else if(useResponse[from]&&useResponse[from].step==254){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    if(msgHandler.kelasFilter(bodys)){
                        await connection.promise().query('CALL PerbaruiNamaKelas(?,?)',[msgHandler.kelasFilter(bodys),useResponse[from].idKelas])
                        client.reply(from, 'Nama kelas sudah diganti!',id)
                        delete useResponse[from]
                    }else{
                        client.reply(from, 'Mohon ulangi!, Ada kesalahan saat kamu mengirimkan nama kelas\nContoh : 7a',id)
                    }
                    connection.end()
                }
                else if(useResponse[from]&&useResponse[from].step==255){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    if(msgHandler.dataValid(bodys)){
                        await connection.promise().query("CALL HapusKelasDanHubungannya(?)", [useResponse[from].idKelas])
                        client.reply(from, `Kelas sudah dihapus`, id)
                        delete useResponse[from]
                    }else if(msgHandler.dataValid(bodys)){
                        client.reply(from, 'Baiklah!', id)
                        delete useResponse[from]
                    }else{
                        client.reply(from, 'Mohon ulangi, kamu yakin ingin menghapus kelas ini? (iya/tidak)',id)
                    }
                    connection.end()
                }
                else if(useResponse[from]&&useResponse[from].step==256){
                    const connection = mysql.createConnection({
                        host: msgHandler.account.host,
                        user: msgHandler.account.root,
                        password : msgHandler.account.password,
                        database: msgHandler.account.database
                    })
                    const indexArray = body.split(',').map((index) => parseInt(index.trim()));
                    indexArray.map(async(index) => {
                        await connection.promise().query('CALL HapusIdKelasMurid(?)', [useResponse[from].dataMurid[index-1]]);
                    });
                    client.reply(from, 'Data sudah diperbarui', id)
                    connection.end()
                    delete useResponse[from]
                }
                else{
                    client.reply(from, 'Mohon untuk mengirimkan pesan "informasi" agar anda mengetahui berbagi informasi layanan yang tersedia di bot ini', id)
                }
            }
        })
    }
})();
