<p align='center'>
<img src="https://github.com/ngoding-bro/schoolbot/blob/master/Media/Front.jpg"
</p>
  
# Halo!
Selamat datang di Bot WhatsApp Sekolah, solusi inovatif yang dirancang khusus untuk memudahkan orang tua dalam memantau perkembangan pendidikan anak-anak mereka. Didukung oleh tren positif penggunaan WhatsApp dan kesadaran akan kebutuhan orang tua terhadap akses cepat dan mudah terhadap informasi, bot ini menyediakan berbagai fitur yang fokus pada pemantauan pembelajaran anak, tugas murid, absensi, dan detail kelas.

### Mengapa Bot WhatsApp Sekolah?
##### 1. Pemantauan Pembelajaran yang Lebih Baik:
Bot ini memungkinkan orang tua untuk memantau kemajuan akademis anak-anak mereka, mendapatkan pemahaman yang lebih baik tentang prestasi belajar, dan menyediakan bantuan jika diperlukan.
##### 2. Informasi Tugas Murid:
Orang tua dapat dengan mudah mengakses informasi tentang tugas dan proyek yang diberikan kepada murid, memastikan partisipasi aktif dan dukungan yang lebih baik di rumah.
##### 3. Pemantauan Absensi:
Fitur pemantauan absensi memungkinkan orang tua untuk melacak kehadiran anak-anak mereka secara real-time, memberikan pemahaman yang lebih baik tentang keaktifan mereka di sekolah.
##### 4. Cek Kelas dan Jadwal:
Orang tua dapat mengakses detail kelas, jadwal harian, dan informasi lainnya untuk menjaga keteraturan dan kedisiplinan dalam pendidikan anak-anak mereka.
# Instalasi
### git clone
```bash
git clone https://github.com/ngoding-bro/schoolbot
```
pastikan sudah diclone terlebih dahulu
### npm
``` bash
npm install gify-cli -g
npm install
```
pastikan sudah terinstal dan aman
### start
```bash
npm start
```
Oh iya! jangan lupa install database SQL nya https://github.com/ngoding-bro/Data/Table.sql (ganti nama database, localhost, dll sesuai dengan keinginan kalian)
dan jangan lupa untuk rubah data database di *msgHandlr.js*
```javascript
//isi dengan databasemu sendiri!
const account = {
  host:"YOUR_HOST",
  user:"YOUR_USER",
  password:"YOUR_PASSWORD",
  database:"YOUR_PASSWORD"
}
```
# Troubleshooting
Pastikan semua dependensi yang diperlukan telah diinstal ya!.
https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md

Perbaiki Stuck di linux, jangan lupa instal google chrome stable:
```bash
> wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
> sudo apt install ./google-chrome-stable_current_amd64.deb
```
# Special Thanks to
* [`open-wa/wa-automate-nodejs`](https://github.com/open-wa/wa-automate-nodejs)
