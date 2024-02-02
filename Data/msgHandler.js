const dbHandler = require('./databaseHandler')
//isi dengan databasemu sendiri!
const account = {
  host:"YOUR_HOST",
  user:"YOUR_USER",
  password:"YOUR_PASSWORD",
  database:"YOUR_PASSWORD"
}
const ubahFormatNomor = (pesan) => {
    function ubahFormatNomor(nomorTelepon) {
        const nomorTeleponBersih = nomorTelepon.replace(/\D/g, '');
        if (nomorTeleponBersih.startsWith('0')) {
            return `62${nomorTeleponBersih.substring(1)}@c.us`;
        }
        return `${nomorTeleponBersih}@c.us`;
    }
    const nomorTeleponDiubah = ubahFormatNomor(pesan);
    return nomorTeleponDiubah
}
const ekstrakGender = (body) => {
    const extractGender = (sentence) => {
        const regexMale = /\b(?:laki-laki|laki|lelaki|cowo|pria)\b/i;
        const regexFemale = /\b(?:perempuan|cewek|wanita)\b/i;
      
        if (regexMale.test(sentence)) {
          return 'L'; // 'L' for Lelaki
        } else if (regexFemale.test(sentence)) {
          return 'P'; // 'P' for Perempuan
        } else {
          return false; // No gender detected
        }
      };
      
    return extractGender(body);
}
const dataValid = (body) => {
  const regexPositive = /\b(ya|sudah|benar|valid|iya nih|sudah|udah|iya|yakin)\b\s*/i;
  const regexNegative = /\b(tidak|belum|salah|ga valid|ngga valid|belum|tadak|engga)\b\s*/i;
    if (regexPositive.test(body)) {
        return "positif";
    } else if (regexNegative.test(body)) {
        return "negatif";
    } else {
        return false;
    }
}
const kelasFilter = (body) => {
  const regex = /\b(7|8|9)[\s\-]*([a-fA-F])\b/;
  const match = body.match(regex);
  if (match) {
    const kelas = match[1];
    const huruf = match[2].toUpperCase();
    const idKelas = `${kelas}-${huruf}`;
    return idKelas
  } else {
    return false
  }
}
const mendapatkanIdDataBaru = (data,optional) => {
  if (data[0].length == 0) {
    return 1;
  } else {
    if(optional=="MURID"){
      const lastIdMurid = data[0][data[0].length - 1].idMurid;
      return lastIdMurid + 1;
    }else if(optional=="GURU"){
      const lastIdMurid = data[0][data[0].length - 1].idGuru;
      return lastIdMurid + 1;
    }else if(optional=="ORANG TUA"){
      console.log(data[0][0])
      const lastIdOrtu = data[0][data[0].length - 1].idOrtu;
      return lastIdOrtu + 1;
    }
  }
};
const isNamaExist = (allData, data, optional) => {
  if(Array.isArray(allData) && allData.length > 0){
    if(optional=='GURU'){
      return allData.some(guru => guru.namaGuru === data)
    }else if(optional=='MURID'){
      return allData.some(murid => murid.namaMurid === data)
    }else if(optional=='ORANG TUA'){
      return allData.some(orangtua => orangtua.namaOrtu === data)
    }
  }else{
    return false
  }
}
const parseQuestionsInput = (input) => {
  const regex = /^(\d+\..+?)\s*(?:A\..+?)\s*(?:B\..+?)\s*(?:C\..+?)\s*(?:D\..+?)\s*Jawaban\s*:\s*(\w)$/gm;
  const matches = input.matchAll(regex);
  const questions = [];
  for (const match of matches) {
    const questionMatch = match[1].trim();
    const options = {
      A: match[0].match(/A\..+?(\n|$)/)[0].replace(/A\./, '').trim(),
      B: match[0].match(/B\..+?(\n|$)/)[0].replace(/B\./, '').trim(),
      C: match[0].match(/C\..+?(\n|$)/)[0].replace(/C\./, '').trim(),
      D: match[0].match(/D\..+?(\n|$)/)[0].replace(/D\./, '').trim(),
    };
    const correctAnswer = match[2].trim();
    questions.push({
      question: questionMatch,
      options: options,
      correctAnswer: correctAnswer,
    });
  }

  return questions;
}
const formatTugasToText = (tugasItems) => {
  let formattedText = '';
  for (let i = 0; i < tugasItems.length; i++) {
    const tugasItem = tugasItems[i];
    formattedText += `${tugasItem.question}\n`;
    Object.entries(tugasItem.options).forEach(([key, value]) => {
      formattedText += `${key}. ${value}\n`;
    });
    formattedText += '\n';
  }
  return formattedText;
}
const getKunciJawaban = (tugasItems) => {
  const kunciJawaban = [];
  for (let i = 0; i < tugasItems.length; i++) {
    const tugasItem = tugasItems[i];
    const nomorSoal = i + 1;
    const kunciJawabanItem = {
      no: nomorSoal,
      kunciJawaban: tugasItem.correctAnswer
    };
    kunciJawaban.push(kunciJawabanItem);
  }
  return kunciJawaban;
}
function updateAnswer(answers, no, jawaban) {
  const existingAnswerIndex = answers.findIndex(answer => answer.no === no);
  if (existingAnswerIndex !== -1) {
      answers[existingAnswerIndex].jawaban = jawaban;
  } else {
      answers.push({ no, jawaban });
  }
  return answers;
}
const parseAnswers = (input) => {
  const regex = /^(\d+)\.\s*([A-Za-z])\s*$/gm;
  var answers;
  let match;
  while ((match = regex.exec(input)) !== null) {
      const no = parseInt(match[1], 10);
      const jawaban = match[2].toUpperCase();
      answers = { no, jawaban };
  }
  return answers;
}
const hitungNilai = (jawabanBenar, totalPertanyaan, skorMaksimal) => {
  const persentaseJawabanBenar = (jawabanBenar / totalPertanyaan) * 100;
  const nilaiAkhir = (persentaseJawabanBenar / 100) * skorMaksimal;
  return nilaiAkhir;
}
const hitungJawabanBenar = (kataKunci, jawaban) => {
  const jawabanBenar = new Set();
  jawaban.forEach(jwb => {
    const kunci = kataKunci.find(k => k.no === jwb.no);
    if (kunci && kunci.kunciJawaban === jwb.jawaban) {
      jawabanBenar.add(jwb.no);
    }
  });
  const jumlahJawabanBenar = jawabanBenar.size;
  return jumlahJawabanBenar;
};
const capitalizeName = (name) => {
  return name.replace(/\b\w/g, (char) => char.toUpperCase());
}
const genderKey = (gender) => {
  switch (gender) {
    case 'P':
      return 'Putri';
    case 'L':
      return 'Putra';
    default:
      return 'Tidak Diketahui';
  }
};

module.exports = {
    ubahFormatNomor,
    ekstrakGender,
    dataValid,
    kelasFilter,
    mendapatkanIdDataBaru,
    isNamaExist,
    parseQuestionsInput,
    formatTugasToText,
    getKunciJawaban,
    updateAnswer,
    parseAnswers,
    hitungNilai,
    hitungJawabanBenar,
    capitalizeName,
    genderKey,
    account
}