/*
SQLyog Ultimate v12.5.1 (64 bit)
MySQL - 10.4.32-MariaDB : Database - data_spesaya
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`data_spesaya` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `data_spesaya`;

/*Table structure for table `absensi` */

DROP TABLE IF EXISTS `absensi`;

CREATE TABLE `absensi` (
  `idAbsensi` int(11) NOT NULL AUTO_INCREMENT,
  `absensiMasuk` timestamp NULL DEFAULT NULL,
  `idMurid` int(11) DEFAULT NULL,
  `absensiPulang` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idAbsensi`),
  KEY `absensi_ibfk_2` (`idMurid`),
  CONSTRAINT `absensi_ibfk_2` FOREIGN KEY (`idMurid`) REFERENCES `murid` (`idMurid`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `absensi` */

/*Table structure for table `guru` */

DROP TABLE IF EXISTS `guru`;

CREATE TABLE `guru` (
  `idGuru` int(11) NOT NULL AUTO_INCREMENT,
  `namaGuru` text NOT NULL,
  `jenisKelamin` char(1) NOT NULL,
  `noTelf` text NOT NULL,
  PRIMARY KEY (`idGuru`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `guru` */

/*Table structure for table `kelas` */

DROP TABLE IF EXISTS `kelas`;

CREATE TABLE `kelas` (
  `idKelas` int(11) NOT NULL AUTO_INCREMENT,
  `namaKelas` text DEFAULT NULL,
  `idGuru` int(11) DEFAULT NULL,
  PRIMARY KEY (`idKelas`),
  KEY `fk_kelas_idGuru` (`idGuru`),
  CONSTRAINT `fk_kelas_idGuru` FOREIGN KEY (`idGuru`) REFERENCES `guru` (`idGuru`) ON DELETE SET NULL,
  CONSTRAINT `kelas_ibfk_1` FOREIGN KEY (`idGuru`) REFERENCES `guru` (`idGuru`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `kelas` */

/*Table structure for table `laporan` */

DROP TABLE IF EXISTS `laporan`;

CREATE TABLE `laporan` (
  `idLaporan` int(11) NOT NULL AUTO_INCREMENT,
  `idAbsensi` int(11) DEFAULT NULL,
  `idMurid` int(11) NOT NULL,
  `idKelaas` int(11) DEFAULT NULL,
  `tanggal` date NOT NULL,
  PRIMARY KEY (`idLaporan`),
  KEY `idAbsensi` (`idAbsensi`),
  KEY `idMurid` (`idMurid`),
  KEY `idKelaas` (`idKelaas`),
  CONSTRAINT `laporan_ibfk_5` FOREIGN KEY (`idAbsensi`) REFERENCES `absensi` (`idAbsensi`),
  CONSTRAINT `laporan_ibfk_6` FOREIGN KEY (`idMurid`) REFERENCES `murid` (`idMurid`) ON DELETE CASCADE,
  CONSTRAINT `laporan_ibfk_8` FOREIGN KEY (`idKelaas`) REFERENCES `kelas` (`idKelas`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `laporan` */

/*Table structure for table `murid` */

DROP TABLE IF EXISTS `murid`;

CREATE TABLE `murid` (
  `idMurid` int(11) NOT NULL AUTO_INCREMENT,
  `namaMurid` text NOT NULL,
  `jenisKelamin` char(1) NOT NULL,
  `noTelf` text NOT NULL,
  `idKelas` int(11) DEFAULT NULL,
  `idOrtu` int(11) DEFAULT NULL,
  PRIMARY KEY (`idMurid`),
  KEY `murid_ibfk_1` (`idKelas`),
  KEY `murid_ibfk_4` (`idOrtu`),
  CONSTRAINT `murid_ibfk_3` FOREIGN KEY (`idKelas`) REFERENCES `kelas` (`idKelas`),
  CONSTRAINT `murid_ibfk_4` FOREIGN KEY (`idOrtu`) REFERENCES `orangtua` (`idOrtu`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `murid` */

/*Table structure for table `nilai` */

DROP TABLE IF EXISTS `nilai`;

CREATE TABLE `nilai` (
  `idNilai` int(11) NOT NULL AUTO_INCREMENT,
  `nilai` float DEFAULT NULL,
  `idTugas` int(11) DEFAULT NULL,
  `idMurid` int(11) DEFAULT NULL,
  `idGuru` int(11) DEFAULT NULL,
  `idLaporan` int(11) DEFAULT NULL,
  PRIMARY KEY (`idNilai`),
  KEY `idMurid` (`idMurid`),
  KEY `fk_nilai_idGuru` (`idGuru`),
  KEY `fk_nilai_idTugas` (`idTugas`),
  KEY `idLaporan` (`idLaporan`),
  CONSTRAINT `fk_nilai_idGuru` FOREIGN KEY (`idGuru`) REFERENCES `guru` (`idGuru`) ON DELETE SET NULL,
  CONSTRAINT `fk_nilai_idMurid` FOREIGN KEY (`idMurid`) REFERENCES `murid` (`idMurid`) ON DELETE CASCADE,
  CONSTRAINT `fk_nilai_idTugas` FOREIGN KEY (`idTugas`) REFERENCES `tugas` (`idTugas`) ON DELETE SET NULL,
  CONSTRAINT `nilai_ibfk_1` FOREIGN KEY (`idTugas`) REFERENCES `tugas` (`idTugas`) ON DELETE SET NULL,
  CONSTRAINT `nilai_ibfk_2` FOREIGN KEY (`idMurid`) REFERENCES `murid` (`idMurid`) ON DELETE SET NULL,
  CONSTRAINT `nilai_ibfk_3` FOREIGN KEY (`idLaporan`) REFERENCES `laporan` (`idLaporan`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `nilai` */

/*Table structure for table `operator` */

DROP TABLE IF EXISTS `operator`;

CREATE TABLE `operator` (
  `idOperator` int(11) NOT NULL AUTO_INCREMENT,
  `namaOperator` text NOT NULL,
  `jenisKelamin` char(1) NOT NULL,
  `noTelf` text NOT NULL,
  PRIMARY KEY (`idOperator`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `operator` */

/*Table structure for table `orangtua` */

DROP TABLE IF EXISTS `orangtua`;

CREATE TABLE `orangtua` (
  `idOrtu` int(11) NOT NULL AUTO_INCREMENT,
  `namaOrtu` text NOT NULL,
  `noTelf` text NOT NULL,
  PRIMARY KEY (`idOrtu`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `orangtua` */

/*Table structure for table `tugas` */

DROP TABLE IF EXISTS `tugas`;

CREATE TABLE `tugas` (
  `idTugas` int(11) NOT NULL AUTO_INCREMENT,
  `isi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `idGuru` int(11) NOT NULL,
  PRIMARY KEY (`idTugas`),
  KEY `fk_tugas_idGuru` (`idGuru`),
  CONSTRAINT `fk_tugas_idGuru` FOREIGN KEY (`idGuru`) REFERENCES `guru` (`idGuru`) ON DELETE CASCADE,
  CONSTRAINT `tugas_ibfk_4` FOREIGN KEY (`idGuru`) REFERENCES `guru` (`idGuru`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `tugas` */

/* Trigger structure for table `absensi` */

DELIMITER $$

/*!50003 DROP TRIGGER*//*!50032 IF EXISTS */ /*!50003 `trigger_absensi` */$$

/*!50003 CREATE */ /*!50017 DEFINER = 'root'@'localhost' */ /*!50003 TRIGGER `trigger_absensi` AFTER INSERT ON `absensi` FOR EACH ROW 
BEGIN
  -- Menangani ketika absensiMasuk tidak NULL
  IF NEW.absensiMasuk IS NOT NULL THEN
    -- Mengecek apakah sudah ada laporan untuk idMurid tersebut di tanggal yang sama
    SET @laporan_count = (
      SELECT COUNT(*)
      FROM laporan
      WHERE idMurid = NEW.idMurid AND DATE(tanggal) = DATE(NOW())
    );
    
    -- Jika belum ada, maka buat laporan baru
    IF @laporan_count = 0 THEN
      INSERT INTO laporan (idAbsensi, idMurid, tanggal)
      VALUES (NEW.idAbsensi, NEW.idMurid, NOW());
    ELSE
      -- Jika laporan sudah ada, dan tanggal updatenya sama dengan hari ini
      UPDATE laporan
      SET idAbsensi = NEW.idAbsensi
      WHERE idMurid = NEW.idMurid AND tanggal = DATE(NOW());
    END IF;
  END IF;
END */$$


DELIMITER ;

/* Trigger structure for table `nilai` */

DELIMITER $$

/*!50003 DROP TRIGGER*//*!50032 IF EXISTS */ /*!50003 `trigger_nilai` */$$

/*!50003 CREATE */ /*!50017 DEFINER = 'root'@'localhost' */ /*!50003 TRIGGER `trigger_nilai` BEFORE INSERT ON `nilai` FOR EACH ROW 
BEGIN
    DECLARE laporan_id INT;

    -- Cek apakah sudah ada laporan untuk idMurid pada tanggal yang sama
    SELECT idLaporan INTO laporan_id
    FROM laporan
    WHERE idMurid = NEW.idMurid AND tanggal = CURDATE()
    LIMIT 1;

    -- Jika belum ada, buat laporan baru
    IF laporan_id IS NULL THEN
        INSERT INTO laporan (idMurid, idKelaas, tanggal)
        VALUES (NEW.idMurid, (SELECT idKelas FROM murid WHERE idMurid = NEW.idMurid), CURDATE());

        -- Dapatkan idLaporan yang baru saja ditambahkan
        SET laporan_id = LAST_INSERT_ID();
    END IF;

    -- Set idLaporan di tabel nilai
    SET NEW.idLaporan = laporan_id;
END */$$


DELIMITER ;

/* Procedure structure for procedure `AmbilDataKelasBerdasarkanNama` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilDataKelasBerdasarkanNama` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilDataKelasBerdasarkanNama`(IN nama_kelas TEXT)
BEGIN
    SELECT * FROM kelas WHERE namaKelas = nama_kelas;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilDataMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilDataMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilDataMurid`()
BEGIN
    SELECT * FROM murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilDataOperatorByNoTelf` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilDataOperatorByNoTelf` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilDataOperatorByNoTelf`(IN nomor_telepon VARCHAR(255))
BEGIN
    SELECT * FROM operator WHERE noTelf = nomor_telepon;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilGuruTanpaKelas` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilGuruTanpaKelas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilGuruTanpaKelas`()
BEGIN
    SELECT namaGuru FROM guru LEFT JOIN kelas ON guru.idGuru = kelas.idGuru WHERE kelas.idGuru IS NULL;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilIdMuridDariNamaMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilIdMuridDariNamaMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilIdMuridDariNamaMurid`(
    IN nama_murid TEXT
)
BEGIN
    SELECT idMurid FROM murid WHERE LOWER(namaMurid) = LOWER(nama_murid);
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoGuru`()
BEGIN
    SELECT noTelf, idGuru, namaGuru, jenisKelamin FROM guru;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoKelasMuridGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoKelasMuridGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoKelasMuridGuru`()
BEGIN
	    SELECT
    kelas.namaKelas,
    GROUP_CONCAT(murid.namaMurid) AS namaMurid,
    guru.namaGuru
FROM
    kelas
LEFT JOIN
    murid ON kelas.idKelas = murid.idKelas
LEFT JOIN
    guru ON kelas.idGuru = guru.idGuru
GROUP BY
    kelas.namaKelas, guru.namaGuru;

END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoMurid`()
BEGIN
    SELECT idMurid, namaMurid FROM murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoMuridBerdasarkanKelas` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoMuridBerdasarkanKelas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoMuridBerdasarkanKelas`(
    IN id_kelas INT
)
BEGIN
    SELECT * FROM murid WHERE idKelas = id_kelas;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoMuridDanGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoMuridDanGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoMuridDanGuru`()
BEGIN
    SELECT idMurid, namaGuru FROM murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoMuridDanKelas` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoMuridDanKelas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoMuridDanKelas`()
BEGIN
    SELECT
        m.namaMurid,
        m.jenisKelamin,
        m.noTelf,
        m.idKelas,
        m.idOrtu,
        k.namaKelas
    FROM
        murid m
    LEFT JOIN
        kelas k ON m.idKelas = k.idKelas;
END */$$
DELIMITER ;

/* Procedure structure for procedure `ambilInfoMuridDanNilai` */

/*!50003 DROP PROCEDURE IF EXISTS  `ambilInfoMuridDanNilai` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `ambilInfoMuridDanNilai`()
BEGIN
    SELECT nilai.idMurid, murid.noTelf
    FROM nilai
    JOIN murid ON nilai.idMurid = murid.idMurid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoMuridTanpaOrtuDenganNama` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoMuridTanpaOrtuDenganNama` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoMuridTanpaOrtuDenganNama`(IN nama_murid TEXT)
BEGIN
    SELECT namaMurid, idMurid, jenisKelamin FROM murid WHERE idOrtu IS NULL AND LOWER(namaMurid) = LOWER(nama_murid);
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoOrangtua` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoOrangtua` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoOrangtua`()
BEGIN
    SELECT idOrtu, namaOrtu FROM orangtua;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoOrangTuaBerdasarkanNoTelf` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoOrangTuaBerdasarkanNoTelf` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoOrangTuaBerdasarkanNoTelf`(
    IN nomor_telepon TEXT
)
BEGIN
    SELECT * FROM orangtua WHERE noTelf = nomor_telepon;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilInfoTugasDanNoTelfGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilInfoTugasDanNoTelfGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilInfoTugasDanNoTelfGuru`(
    IN nomor_telepon TEXT
)
BEGIN
    SELECT t.idTugas, t.isi, g.noTelf AS guru_noTelf
    FROM tugas t
    JOIN guru g ON t.idGuru = g.idGuru
    WHERE g.noTelf = nomor_telepon;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilSemuaDataGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilSemuaDataGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilSemuaDataGuru`()
BEGIN
    SELECT * FROM guru;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilSemuaDataOperator` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilSemuaDataOperator` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilSemuaDataOperator`()
BEGIN
    SELECT * FROM operator;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilSemuaDataOrangTua` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilSemuaDataOrangTua` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilSemuaDataOrangTua`()
BEGIN
    SELECT * FROM orangtua;
END */$$
DELIMITER ;

/* Procedure structure for procedure `AmbilSemuaIdGuruDariKelas` */

/*!50003 DROP PROCEDURE IF EXISTS  `AmbilSemuaIdGuruDariKelas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `AmbilSemuaIdGuruDariKelas`()
BEGIN
    SELECT k.idGuru FROM kelas k;
END */$$
DELIMITER ;

/* Procedure structure for procedure `CariGuruBerdasarkanNama` */

/*!50003 DROP PROCEDURE IF EXISTS  `CariGuruBerdasarkanNama` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `CariGuruBerdasarkanNama`(
    IN nama_guru TEXT
)
BEGIN
    SELECT * FROM guru WHERE namaGuru LIKE CONCAT('%', nama_guru, '%');
END */$$
DELIMITER ;

/* Procedure structure for procedure `CariIdGuruDariNamaGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `CariIdGuruDariNamaGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `CariIdGuruDariNamaGuru`(
    IN nama_guru TEXT
)
BEGIN
    SELECT idGuru FROM guru WHERE LOWER(namaGuru) LIKE LOWER(CONCAT('%', nama_guru, '%'));
END */$$
DELIMITER ;

/* Procedure structure for procedure `CariIdOrtuDariNamaOrtu` */

/*!50003 DROP PROCEDURE IF EXISTS  `CariIdOrtuDariNamaOrtu` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `CariIdOrtuDariNamaOrtu`(
    IN nama_ortu TEXT
)
BEGIN
    SELECT idOrtu FROM orangtua WHERE LOWER(namaOrtu) LIKE LOWER(CONCAT('%', nama_ortu, '%'));
END */$$
DELIMITER ;

/* Procedure structure for procedure `DapatkanIdKelasBerdasarkanNama` */

/*!50003 DROP PROCEDURE IF EXISTS  `DapatkanIdKelasBerdasarkanNama` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `DapatkanIdKelasBerdasarkanNama`(
    IN nama_kelas TEXT
)
BEGIN
    SELECT idKelas FROM kelas WHERE namaKelas = nama_kelas;
END */$$
DELIMITER ;

/* Procedure structure for procedure `DapatkanIdMuridBerdasarkanNoTelf` */

/*!50003 DROP PROCEDURE IF EXISTS  `DapatkanIdMuridBerdasarkanNoTelf` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `DapatkanIdMuridBerdasarkanNoTelf`(IN nomor_telepon TEXT)
BEGIN
    SELECT idMurid
    FROM murid
    WHERE noTelf = nomor_telepon;
END */$$
DELIMITER ;

/* Procedure structure for procedure `dapatNoTelfMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `dapatNoTelfMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `dapatNoTelfMurid`()
BEGIN
    SELECT noTelf FROM murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `HapusDataGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `HapusDataGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `HapusDataGuru`(
    IN kriteria INT -- Sesuaikan tipe data dan nama parameter dengan kebutuhan
)
BEGIN
    DELETE FROM guru WHERE idGuru = kriteria; -- Sesuaikan kriteria dengan kolom yang sesuai
END */$$
DELIMITER ;

/* Procedure structure for procedure `HapusDataMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `HapusDataMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `HapusDataMurid`(
    IN kriteria INT -- Sesuaikan tipe data dan nama parameter dengan kebutuhan
)
BEGIN
    DELETE FROM murid WHERE idMurid = kriteria; -- Sesuaikan kriteria dengan kolom yang sesuai
END */$$
DELIMITER ;

/* Procedure structure for procedure `HapusIdKelasMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `HapusIdKelasMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `HapusIdKelasMurid`(
    IN id_murid INT
)
BEGIN
    UPDATE murid SET idKelas = NULL WHERE idMurid = id_murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `HapusKelasDanHubungannya` */

/*!50003 DROP PROCEDURE IF EXISTS  `HapusKelasDanHubungannya` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `HapusKelasDanHubungannya`(
    IN id_kelas INT
)
BEGIN
    START TRANSACTION;
    UPDATE murid SET idKelas = NULL WHERE idKelas = id_kelas;
    UPDATE laporan SET idKelaas = NULL WHERE idKelaas = id_kelas;
    DELETE FROM kelas WHERE idKelas = id_kelas;
    COMMIT;
END */$$
DELIMITER ;

/* Procedure structure for procedure `HapusOrangtua` */

/*!50003 DROP PROCEDURE IF EXISTS  `HapusOrangtua` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `HapusOrangtua`(IN ortu_id INT)
BEGIN
    DELETE FROM orangtua WHERE idOrtu = ortu_id;
END */$$
DELIMITER ;

/* Procedure structure for procedure `HapusTugas` */

/*!50003 DROP PROCEDURE IF EXISTS  `HapusTugas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `HapusTugas`(
    IN id_tugas INT
)
BEGIN
    DELETE FROM tugas WHERE idTugas = id_tugas;
END */$$
DELIMITER ;

/* Procedure structure for procedure `mencariTugasByGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `mencariTugasByGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `mencariTugasByGuru`(IN namaGuru TEXT)
BEGIN
    SELECT t.idTugas, t.isi, t.idGuru, g.namaGuru
    FROM tugas t
    JOIN guru g ON t.idGuru = g.idGuru
    WHERE g.namaGuru LIKE namaGuru;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiIdGuruKelas` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiIdGuruKelas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiIdGuruKelas`(
    IN id_guru INT,
    IN id_kelas INT
)
BEGIN
    UPDATE kelas SET idGuru = id_guru WHERE idKelas = id_kelas;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiIdKelasMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiIdKelasMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiIdKelasMurid`(
    IN id_kelas INT,
    IN id_murid INT
)
BEGIN
    UPDATE murid SET idKelas = id_kelas WHERE idMurid = id_murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiIdOrtuMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiIdOrtuMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiIdOrtuMurid`(
    IN id_ortu INT,
    IN id_murid INT
)
BEGIN
    UPDATE murid SET idOrtu = id_ortu WHERE idMurid = id_murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiJenisKelaminMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiJenisKelaminMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiJenisKelaminMurid`(
    IN jenis_kelamin VARCHAR(10),
    IN id_murid INT
)
BEGIN
    UPDATE murid SET jenisKelamin = jenis_kelamin WHERE idMurid = id_murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiNamaGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiNamaGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiNamaGuru`(
    IN nama_guru TEXT,
    IN id_guru INT
)
BEGIN
    UPDATE guru SET namaGuru = nama_guru WHERE idGuru = id_guru;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiNamaKelas` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiNamaKelas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiNamaKelas`(
    IN nama_kelas_baru TEXT,
    IN id_kelas INT
)
BEGIN
    UPDATE kelas SET namaKelas = nama_kelas_baru WHERE idKelas = id_kelas;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiNamaMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiNamaMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiNamaMurid`(
    IN nama_murid TEXT,
    IN id_murid INT
)
BEGIN
    UPDATE murid SET namaMurid = nama_murid WHERE idMurid = id_murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiNamaOrtu` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiNamaOrtu` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiNamaOrtu`(
    IN nama_baru TEXT,
    IN nama_lama TEXT
)
BEGIN
    UPDATE orangtua SET namaOrtu = nama_baru WHERE namaOrtu = nama_lama;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiNoTelfGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiNoTelfGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiNoTelfGuru`(
    IN nomor_telepon TEXT,
    IN id_guru INT
)
BEGIN
    UPDATE guru SET noTelf = nomor_telepon WHERE idGuru = id_guru;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiNoTelfMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiNoTelfMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiNoTelfMurid`(
    IN nomor_telepon TEXT,
    IN id_murid INT
)
BEGIN
    UPDATE murid SET noTelf = nomor_telepon WHERE idMurid = id_murid;
END */$$
DELIMITER ;

/* Procedure structure for procedure `PerbaruiNoTelfOrangTua` */

/*!50003 DROP PROCEDURE IF EXISTS  `PerbaruiNoTelfOrangTua` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `PerbaruiNoTelfOrangTua`(
    IN nomor_telepon TEXT,
    IN id_ortu INT
)
BEGIN
    UPDATE orangtua SET noTelf = nomor_telepon WHERE idOrtu = id_ortu;
END */$$
DELIMITER ;

/* Procedure structure for procedure `TambahDataGuru` */

/*!50003 DROP PROCEDURE IF EXISTS  `TambahDataGuru` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `TambahDataGuru`(
    IN id_guru INT,
    IN nama_guru VARCHAR(255),
    IN jenis_kelamin VARCHAR(10),
    IN no_telf VARCHAR(15)
)
BEGIN
    INSERT INTO guru (idGuru, namaGuru, jenisKelamin, noTelf) VALUES (id_guru, nama_guru, jenis_kelamin, no_telf);
END */$$
DELIMITER ;

/* Procedure structure for procedure `TambahDataKelas` */

/*!50003 DROP PROCEDURE IF EXISTS  `TambahDataKelas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `TambahDataKelas`(
    IN nama_kelas TEXT,
    IN id_guru INT
)
BEGIN
    INSERT INTO kelas (namaKelas, idGuru) VALUES (nama_kelas, id_guru);
END */$$
DELIMITER ;

/* Procedure structure for procedure `TambahDataMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `TambahDataMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `TambahDataMurid`(IN id_murid INT, IN nama_murid TEXT, IN jenis_kelamin VARCHAR(10), IN no_telf TEXT)
BEGIN
    INSERT INTO murid (idMurid, namaMurid, jenisKelamin, noTelf) VALUES (id_murid, nama_murid, jenis_kelamin, no_telf);
END */$$
DELIMITER ;

/* Procedure structure for procedure `TambahDataOrangTua` */

/*!50003 DROP PROCEDURE IF EXISTS  `TambahDataOrangTua` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `TambahDataOrangTua`(
    IN id_ortu INT,
    IN nama_ortu TEXT,
    IN no_telf TEXT
)
BEGIN
    INSERT INTO orangtua (idOrtu, namaOrtu, noTelf) VALUES (id_ortu, nama_ortu, no_telf);
END */$$
DELIMITER ;

/* Procedure structure for procedure `TambahNilaiTugasMurid` */

/*!50003 DROP PROCEDURE IF EXISTS  `TambahNilaiTugasMurid` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `TambahNilaiTugasMurid`(IN nilai FLOAT, IN id_tugas INT, IN id_murid INT)
BEGIN
    INSERT INTO nilai (nilai, idTugas, idMurid) VALUES (nilai, id_tugas, id_murid);
END */$$
DELIMITER ;

/* Procedure structure for procedure `TambahTugas` */

/*!50003 DROP PROCEDURE IF EXISTS  `TambahTugas` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `TambahTugas`(IN id_guru INT, IN isi_tugas LONGTEXT)
BEGIN
    INSERT INTO tugas (idGuru, isi) VALUES (id_guru, isi_tugas);
END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
