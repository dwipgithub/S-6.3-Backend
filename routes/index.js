import express from "express";

// Token Generate
import {
  getUser,
  showUser,
  insertUser,
  login,
  loginSSO,
  loginSSOAdmin,
  logout,
  changePassword,
} from "../controllers/UsersController.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import { verifyCsrfToken } from "../middleware/VerifyCsrfToken.js";
import { refreshToken } from "../controllers/RefreshTokenController.js";

// Absensi
import { getAbsensi, getAbsensiNew } from "../controllers/AbsensiController.js";

//Punya Bibo Ganteng

import { getDataJenisPengunjung } from "../controllers/JenisPengunjungRLTigaTitikEmpatController.js";
import { getDataJenisKegiatanRLTigaTitikLima } from "../controllers/JenisKegiatanRLTigaTitikLimaController.js";
import { getDataJenisKegiatanRLTigaTitikEnam } from "../controllers/JenisKegiatanRLTigaTitikEnamController.js";
import { getDataJenisKegiatanRLTigaTitikTujuh } from "../controllers/JenisKegiatanRLTigaTitikTujuhController.js";

// RL3.3
import {
  getDataRLTigaTitikTiga,
  insertDataRLTigaTitikTiga,
  updateDataRLTigaTitikTiga,
  deleteDataRLTigaTitikTiga,
  getDataRLTigaTitikTigaDetails,
  getDataRLTigaTitikTigaById,
} from "../controllers/RLTigaTitikTigaController.js";

// RL 3.4
import {
  getDataRLTigaTitikEmpat,
  getRLTigaTitikEmpatById,
  insertDataRLTigaTitikEmpat,
  updateDataRLTigaTitikEmpat,
  deleteDataRLTigaTitikEmpat,
  getDataRLTigaTitikEmpatSatuSehat,
  getDataRLTigaTitikEmpatSatusehatLocal,
} from "../controllers/RLTigaTitikEmpatController.js";

// RL 3.5
import {
  getDataRLTigaTitikLima,
  getRLTigaTitikLimaById,
  insertDataRLTigaTitikLima,
  updateDataRLTigaTitikLima,
  deleteDataRLTigaTitikLima,
  getDataRLTigaTitikLimaSatuSehat,
} from "../controllers/RLTigaTitikLimaController.js";

// RL 3.6
import {
  getDataRLTigaTitikEnam,
  getRLTigaTitikEnamById,
  insertDataRLTigaTitikEnam,
  updateDataRLTigaTitikEnam,
  deleteDataRLTigaTitikEnam,
} from "../controllers/RLTigaTitikEnamController.js";

// RL 3.7
import {
  getDataRLTigaTitikTujuh,
  getRLTigaTitikTujuhById,
  insertDataRLTigaTitikTujuh,
  updateDataRLTigaTitikTujuh,
  deleteDataRLTigaTitikTujuh,
} from "../controllers/RLTigaTitikTujuhController.js";

//Jenis Spesialisasi 3.10
import { getDataJenisSpesialisTigaTitikSepuluh } from "../controllers/JenisSpesialisTigaTitikSepuluhController.js";

// Rumah Sakit
import {
  showRumahSakit,
  getRumahSakit,
} from "../controllers/RumahSakitController.js";

// Jenis Pelayanan
import { getRLTigaTitikDuaJenisPelayanan } from "../controllers/RLTigaTitikDuaJenisPelayananController.js";

// Jenis Kegiatan 3.11
import { getDataJenisKegiatanRLTigaTitikSebelas } from "../controllers/JenisKegiatanRLTigaTitikSebelasController.js";

// Jenis Spesialisasi 3.12
import { getDataSpesialisasiRLTigaTitikDuaBelas } from "../controllers/RLTigaTitikDuaBelasSpesialisasiController.js";

//ICD
import {
  getIcdRanap,
  getIcdRanapbyId,
  getIcdRanapbySearch,
} from "../controllers/ICDController.js";

//Jenis Pemeriksaan RL 3.8
import {
  getDataPemeriksaanRlTigaTitikDelapan,
  getDataPemeriksaanDetailRlTigaTitikDelapan,
} from "../controllers/RLTigaTitikDelapanPemeriksaanController.js";

//Jenis Kegiatan RL 3.14
import { getDataJenisKegiatanRLTigaTitikEmpatBelas } from "../controllers/RLTigaTitikEmpatBelasJenisKegiatanController.js";

//Jenis Pelayanan 3.3
import { getDataJenisPelayananTigaTitikTiga } from "../controllers/JenisPelayananTigaTitikTigaController.js";

//Golongan Obat RL 3.17
import { getGolonganObatRLTigaTitikTujuhBelas } from "../controllers/RLTigaTitikTujuhBelasGolonganObatController.js";

//Golongan Obat RL 3.18
import { getGolonganObatRLTigaTitikDelapanBelas } from "../controllers/RLTigaTitikDelapanBelasGolonganObatController.js";

// Golongan Obat 3.19
import { getDataGolonganObatTigaTitikSembilanBelas } from "../controllers/GolonganObatTigaTitikSembilanBelasController.js";

// MASTER 3.13
import {
  getDataJenisTindakanRLTigaTitikTigaBelas,
  getDataJenisTindakanHeaderRLTigaTitikTigaBelas,
} from "../controllers/RLTigaTitikTigaBelasJenisTindakanController.js";

// MASTER 5.1
import {
  getDataIcdRLLimaTitikSatu,
  getIcdRajalbySearch,
  getIcdRajalbyId,
} from "../controllers/IcdRLLimaTitikSatuController.js";

// Provinsi
import {
  getProvinsi,
  showProvinsi,
} from "../controllers/ProvinsiController.js";

// KabKota
import { getKabKota, showKabKota } from "../controllers/KabKotaController.js";

// RL 3.1
import {
  getRLTigaTitikSatu,
  showRLTigaTitikSatu,
} from "../controllers/RLTigaTitikSatuController.js";

// RL 3.2
import {
  getRLTigaTitikDua,
  showRLTigaTitikDua,
  insertRLTigaTitikDua,
  deleteRLTigaTitikDua,
  updateRLTigaTitikDua,
} from "../controllers/RLTigaTitikDuaController.js";

// RL 3.2 Validasi
import {
  getDataRLTigaTitikDuaValidasi,
  insertDataRLTigaTitikDuaValidasi,
  updateDataRLTigaTitikDuaValidasi,
} from "../controllers/RLTigaTitikDuaValidasiController.js";

// RL 3.3 validasi

import {
  getDataRLTigaTitikTigaValidasi,
  insertDataRLTigaTitikTigaValidasi,
  updateDataRLTigaTitikTigaValidasi,
} from "../controllers/RLTigaTitikTigaValidasiController.js";

import {
  getDataRLTigaTitikEmpatValidasi,
  insertDataRLTigaTitikEmpatValidasi,
  updateDataRLTigaTitikEmpatValidasi,
} from "../controllers/RLTigaTitikEmpatValidasiController.js";

import {
  getDataRLTigaTitikLimaValidasi,
  insertDataRLTigaTitikLimaValidasi,
  updateDataRLTigaTitikLimaValidasi,
} from "../controllers/RLTigaTitikLimaValidasiController.js";

import {
  getDataRLTigaTitikEnamValidasi,
  insertDataRLTigaTitikEnamValidasi,
  updateDataRLTigaTitikEnamValidasi,
} from "../controllers/RLTigaTitikEnamValidasiController.js";

import {
  getDataRLTigaTitikTujuhValidasi,
  insertDataRLTigaTitikTujuhValidasi,
  updateDataRLTigaTitikTujuhValidasi,
} from "../controllers/RLTigaTitikTujuhValidasiController.js";

import {
  getDataRLTigaTitikDelapanValidasi,
  insertDataRLTigaTitikDelapanValidasi,
  updateDataRLTigaTitikDelapanValidasi,
} from "../controllers/RLTigaTitikDelapanValidasiController.js";

import {
  getDataRLTigaTitikSembilanValidasi,
  insertDataRLTigaTitikSembilanValidasi,
  updateDataRLTigaTitikSembilanValidasi,
} from "../controllers/RLTigaTitikSembilanValidasiController.js";

//Jenis Kegiatan RL 3.9
import { getDataJenisKegiatanTigaTitikSembilan } from "../controllers/RLTigaTitikSembilanJenisKegiatanController.js";

//Jenis Kegiatan 3.15
import { getDataJenisKegiatanTigaTitikLimaBelas } from "../controllers/JenisKegiatanTigaTitikLimaBelasController.js";

// RL 3.16 Metoda
import { getDataJenisPelayananKeluargaBerencana } from "../controllers/RLTigaTitikEnamBelasMetodaController.js";

// RL 3.9 baru
import {
  getRLTigaTitikSembilan,
  showRLTigaTitikSembilan,
  insertRLTigaTitikSembilan,
  deleteRLTigaTitikSembilan,
  updateRLTigaTitikSembilan,
} from "../controllers/RLTigaTitikSembilanController.js";

//RL3.10
import {
  getDataRLTigaTitikSepuluh,
  insertDataRLTigaTitikSepuluh,
  updateDataRLTigaTitikSepuluh,
  deleteDataRLTigaTitikSepuluh,
  getDataRLTigaTitikSepuluhDetails,
  getDataRLTigaTitikSepuluhById,
} from "../controllers/RLTigaTitikSepuluhController.js";

// RL 3.11
import {
  insertDataRLTigaTitikSebelas,
  getDataRLTigaTitikSebelas,
  getDataRLTigaTitikSebelasDetail,
  getRLTigaTitikSebelas,
  showRLTigaTitikSebelas,
  getRLTigaTitikSebelasById,
  updateDataRLTigaTitikSebelas,
  deleteDataRLTigaTitikSebelas,
} from "../controllers/RLTigaTitikSebelasController.js";

// RL 3.12
import {
  insertDataRLTigaTitikDuaBelas,
  getDataRLTigaTitikDuaBelas,
  getRLTigaTitikDuaBelasById,
  updateDataRLTigaTitikDuaBelas,
  deleteDataRLTigaTitikDuaBelas,
  getRLTigaTitikDuaBelas,
  showRLTigaTitikDuaBelas,
} from "../controllers/RLTigaTitikDuaBelasController.js";

// RL3.15
import {
  getDataRLTigaTitikLimaBelas,
  insertDataRLTigaTitikLimaBelas,
  updateDataRLTigaTitikLimaBelas,
  deleteDataRLTigaTitikLimaBelas,
  getDataRLTigaTitikLimaBelasDetails,
  getDataRLTigaTitikLimaBelasById,
} from "../controllers/RLTigaTitikLimaBelasController.js";

// RL 3.16
import {
  insertDataRLTigaTitikEnamBelas,
  getDataRLTigaTitikEnamBelas,
  getRLTigaTitikEnamBelasById,
  getRLTigaTitikEnamBelas,
  showRLTigaTitikEnamBelas,
  updateDataRLTigaTitikEnamBelas,
  deleteDataRLTigaTitikEnamBelas,
} from "../controllers/RLTigaTitikEnamBelasController.js";

// RL 3.17 baru
import {
  getRLTigaTitikTujuhBelas,
  showRLTigaTitikTujuhBelas,
  insertDataRLTigaTitikTujuhBelas,
  deleteRLTigaTitikTujuhBelas,
  updateRLTigaTitikTujuhBelas,
} from "../controllers/RLTigaTitikTujuhBelasController.js";

// RL 3.18 baru
import {
  getRLTigaTitikDelapanBelas,
  showRLTigaTitikDelapanBelas,
  insertDataRLTigaTitikDelapanBelas,
  deleteRLTigaTitikDelapanBelas,
  updateRLTigaTitikDelapanBelas,
} from "../controllers/RLTigaTitikDelapanBelasController.js";

//RL3.19
import {
  getDataRLTigaTitikSembilanBelas,
  insertDataRLTigaTitikSembilanBelas,
  updateDataRLTigaTitikSembilanBelas,
  deleteDataRLTigaTitikSembilanBelas,
  getDataRLTigaTitikSembilanBelasDetails,
  getDataRLTigaTitikSembilanBelasById,
} from "../controllers/RLTigaTitikSembilanBelasController.js";

// RL 3.8
import {
  deleteDataRLTigaTitikDelapan,
  getDataRLTigaTitikDelapan,
  getDataRLTigaTitikDelapanById,
  getDataRLTigaTitikDelapanDetailPemeriksaan,
  insertDataRLTigaTitikDelapan,
  updateDataRLTigaTitikDelapan,
} from "../controllers/RLTigaTitikDelapanController.js";

// RL 4.1
import {
  deleteDataRLEmpatTitikSatu,
  getDataRLEmpatTitikSatu,
  getDataRLEmpatTitikSatuById,
  getDataRLEmpatTitikSatuPaging,
  // getRLEmpatTitikDua,
  // getRLEmpatTitikTiga,
  insertDataRLEmpatTitikSatu,
  updateDataRLEmpatTitikSatu,
  getDataRLEmpatTitikSatuWithSatuSehat,
  subscribeSyncStatus,
} from "../controllers/RLEmpatTitikSatuController.js";

// RL 4.2
import { getRLEmpatTitikDua } from "../controllers/RLEmpatTitikDuaController.js";

// RL 4.3
import { getRLEmpatTitikTiga } from "../controllers/RLEmpatTitikTigaController.js";

// RL 3.13 NEW
import {
  insertDataRLTigaTitikTigaBelas,
  getDataRLTigaTitikTigaBelas,
  getRLTigaTitikTigaBelasById,
  getRLTigaTitikTigaBelas,
  showRLTigaTitikTigaBelas,
  updateDataRLTigaTitikTigaBelas,
  deleteDataRLTigaTitikTigaBelas,
} from "../controllers/RLTigaTitikTigaBelasController.js";

// RL 5.1
import {
  deleteDataRLLimaTitikSatu,
  getDataRLLimaTitikSatuPaging,
  getDataRLLimaTitikSatu,
  getDataRLLimaTitikSatuById,
  insertdataRLLimaTitikSatu,
  updateDataRLLimaTitikSatu,
  getDataRLLimaTitikSatuSatuSehat,
  getDataRLLimaTitikSatuSatuSehatShow,
  getDataRLLimaTitikSatuSatuSehatShowPaging,
  getMasterumursatusehat,
} from "../controllers/RLLimaTitikSatuController.js";

// RL 3.14
import {
  deleteDataRLTigaTitikEmpatBelas,
  getDataRLTigaTitikEmpatBelasById,
  getDataRLTigaTitikEmpatBelasDetailKegiatan,
  insertDataRLTigaTitikEmpatBelas,
  updateDataRLTigaTitikEmpatBelas,
} from "../controllers/RLTigaTitikEmpatBelasController.js";

// RL 5.2
import { getRLLimaTitikDua } from "../controllers/RLLimaTitikDuaController.js";

// RL 5.3
import { getRLLimatitikTiga } from "../controllers/RLLimaTitikTigaController.js";

// Absensi

import { insertValidasi } from "../controllers/ValidasiController.js";

import { getStatusSatset } from "../controllers/StatusSatset.js";

//VALIDASI RL 3.10
import {
  getDataRLTigaTitikSepuluhValidasi,
  insertDataRLTigaTitikSepuluhValidasi,
  updateDataRLTigaTitikSepuluhValidasi,
} from "../controllers/RLTigaTitikSepuluhValidasiController.js";

//VALIDASI RL 3.11
import {
  getDataRLTigaTitikSebelasValidasi,
  insertDataRLTigaTitikSebelasValidasi,
  updateDataRLTigaTitikSebelasValidasi,
} from "../controllers/RLTigaTitikSebelasValidasiController.js";

//VALIDASI RL 3.12
import {
  getDataRLTigaTitikDuaBelasValidasi,
  insertDataRLTigaTitikDuaBelasValidasi,
  updateDataRLTigaTitikDuaBelasValidasi,
} from "../controllers/RLTigaTitikDuaBelasValidasiController.js";

//VALIDASI RL 3.13
import {
  getDataRLTigaTitikTigaBelasValidasi,
  insertDataRLTigaTitikTigaBelasValidasi,
  updateDataRLTigaTitikTigaBelasValidasi,
} from "../controllers/RLTigaTitikTigaBelasValidasiController.js";

//VALIDASI RL 3.14
import {
  getDataRLTigaTitikEmpatBelasValidasi,
  insertDataRLTigaTitikEmpatBelasValidasi,
  updateDataRLTigaTitikEmpatBelasValidasi,
} from "../controllers/RLTigaTitikEmpatBelasValidasiController.js";

//VALIDASI RL 3.15
import {
  getDataRLTigaTitikLimaBelasValidasi,
  insertDataRLTigaTitikLimaBelasValidasi,
  updateDataRLTigaTitikLimaBelasValidasi,
} from "../controllers/RLTigaTitikLimaBelasValidasiController.js";

//VALIDASI RL 3.16
import {
  getDataRLTigaTitikEnamBelasValidasi,
  insertDataRLTigaTitikEnamBelasValidasi,
  updateDataRLTigaTitikEnamBelasValidasi,
} from "../controllers/RLTigaTitikEnamBelasValidasiController.js";

//VALIDASI RL 3.17
import {
  getDataRLTigaTitikTujuhBelasValidasi,
  insertDataRLTigaTitikTujuhBelasValidasi,
  updateDataRLTigaTitikTujuhBelasValidasi,
} from "../controllers/RLTigaTitikTujuhBelasValidasiController.js";

//VALIDASI RL 3.18
import {
  getDataRLTigaTitikDelapanBelasValidasi,
  insertDataRLTigaTitikDelapanBelasValidasi,
  updateDataRLTigaTitikDelapanBelasValidasi,
} from "../controllers/RLTigaTitikDelapanBelasValidasiController.js";

// FILE VALIDASI
import {
  getDataRLTigaTitikSembilanBelasValidasi,
  insertDataRLTigaTitikSembilanBelasValidasi,
  updateDataRLTigaTitikSembilanBelasValidasi,
} from "../controllers/RLTigaTitikSembilanBelasValidasiController.js";

// FILE VALIDASI RL 4.1
import {
  getDataRLEmpatTitikSatuValidasi,
  insertDataRLEmpatTitikSatuValidasi,
  updateDataRLEmpatTitikSatuValidasi,
} from "../controllers/RLEmpatTitikSatuValidasiController.js";

import {
  getDataRLEmpatTitikDuaValidasi,
  insertDataRLEmpatTitikDuaValidasi,
  updateDataRLEmpatTitikDuaValidasi,
} from "../controllers/RLEmpatTitikDuaValidasiController.js";

import {
  getDataRLEmpatTitikTigaValidasi,
  insertDataRLEmpatTitikTigaValidasi,
  updateDataRLEmpatTitikTigaValidasi,
} from "../controllers/RLEmpatTitikTigaValidasiController.js";

import {
  getDataRLLimaTitikSatuValidasi,
  insertDataRLLimaTitikSatuValidasi,
  updateDataRLLimaTitikSatuValidasi,
} from "../controllers/RLLimaTitikSatuValidasiController.js";

import {
  getDataRLLimaTitikDuaValidasi,
  insertDataRLLimaTitikDuaValidasi,
  updateDataRLLimaTitikDuaValidasi,
} from "../controllers/RLLimaTitikDuaValidasiController.js";

import {
  getDataRLLimaTitikTigaValidasi,
  insertDataRLLimaTitikTigaValidasi,
  updateDataRLLimaTitikTigaValidasi,
} from "../controllers/RLLimaTitikTigaValidasiController.js";

import { verifyHmac } from "../middleware/verifyHmac.js"; // sesuaikan path

const router = express.Router();

// Validasi
router.post("/apisirs6v2/validasi", verifyToken, insertValidasi);

// Token
router.post("/apisirs6v2/loginsirs", login);
router.delete("/apisirs6v2/logout", verifyCsrfToken, logout);
router.get("/apisirs6v2/token", refreshToken);

router.get("/apisirs6v2/login", loginSSO);
router.get("/apisirs6v2/loginadmin", loginSSOAdmin);

// Absensi
// router.get("/apisirs6v2/absensi", verifyToken, getAbsensi);
router.get("/apisirs6v2/absensi", verifyToken, getAbsensiNew);

// User
router.get("/apisirs/users", verifyToken, getUser);
router.get("/apisirs/users/:id", verifyToken, showUser);
router.post("/apisirs/users", verifyToken, insertUser);
router.patch("/apisirs/users/:id/admin", verifyToken, changePassword);

// Rumah Sakit
router.get("/apisirs6v2/rumahsakit/:id", verifyToken, showRumahSakit);
router.get("/apisirs6v2/rumahsakit", verifyToken, getRumahSakit);

// Provinsi
router.get("/apisirs6v2/provinsi", verifyToken, getProvinsi);
router.get("/apisirs6v2/provinsi/:id", verifyToken, showProvinsi);

// KabKota
router.get("/apisirs6v2/kabkota", verifyToken, getKabKota);
router.get("/apisirs6v2/kabkota/:id", verifyToken, showKabKota);

router.get("/apisirs6v2/status-satset", verifyToken, getStatusSatset);

// RL 3.1
router.get("/apisirs6v2/rltigatitiksatu", verifyToken, getRLTigaTitikSatu);
router.get("/apisirs6v2/rltigatitiksatu/:id", verifyToken, showRLTigaTitikSatu);

// RL 3.2
router.post(
  "/apisirs6v2/rltigatitikdua",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertRLTigaTitikDua,
);

router.get("/apisirs6v2/rltigatitikdua", verifyToken, getRLTigaTitikDua);

router.delete(
  "/apisirs6v2/rltigatitikdua/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteRLTigaTitikDua,
);

router.get("/apisirs6v2/rltigatitikdua/:id", verifyToken, showRLTigaTitikDua);

router.patch(
  "/apisirs6v2/rltigatitikdua/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateRLTigaTitikDua,
);

// RL 3.2 Validasi
router.get(
  "/apisirs6v2/rltigatitikduavalidasi",
  verifyToken,
  getDataRLTigaTitikDuaValidasi,
);

router.post(
  "/apisirs6v2/rltigatitikduavalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikDuaValidasi,
);

router.patch(
  "/apisirs6v2/rltigatitikduavalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikDuaValidasi,
);

// RL 3.3 Validasi

router.get(
  "/apisirs6v2/rltigatitiktigavalidasi",
  verifyToken,
  getDataRLTigaTitikTigaValidasi,
);

router.post(
  "/apisirs6v2/rltigatitiktigavalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTigaValidasi,
);

router.patch(
  "/apisirs6v2/rltigatitiktigavalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikTigaValidasi,
);

// RL 3.4 Validasi

router.get(
  "/apisirs6v2/rltigatitikempatvalidasi",
  verifyToken,
  getDataRLTigaTitikEmpatValidasi,
);
router.post(
  "/apisirs6v2/rltigatitikempatvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEmpatValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitikempatvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEmpatValidasi,
);

// RL 3.5 Validasi

router.get(
  "/apisirs6v2/rltigatitiklimavalidasi",
  verifyToken,
  getDataRLTigaTitikLimaValidasi,
);

router.post(
  "/apisirs6v2/rltigatitiklimavalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikLimaValidasi,
);

router.patch(
  "/apisirs6v2/rltigatitiklimavalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikLimaValidasi,
);

// RL 3.6 Validasi

router.get(
  "/apisirs6v2/rltigatitikenamvalidasi",
  verifyToken,
  getDataRLTigaTitikEnamValidasi,
);

router.post(
  "/apisirs6v2/rltigatitikenamvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEnamValidasi,
);

router.patch(
  "/apisirs6v2/rltigatitikenamvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEnamValidasi,
);

// RL 3.7 Validasi

router.get(
  "/apisirs6v2/rltigatitiktujuhvalidasi",
  verifyToken,
  getDataRLTigaTitikTujuhValidasi,
);
router.post(
  "/apisirs6v2/rltigatitiktujuhvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTujuhValidasi,
);

router.patch(
  "/apisirs6v2/rltigatitiktujuhvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikTujuhValidasi,
);

// RL 3.8 Validasi

router.get(
  "/apisirs6v2/rltigatitikdelapanvalidasi",
  verifyToken,
  getDataRLTigaTitikDelapanValidasi,
);
router.post(
  "/apisirs6v2/rltigatitikdelapanvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikDelapanValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitikdelapanvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikDelapanValidasi,
);

// RL 3.9 Validasi

router.get(
  "/apisirs6v2/rltigatitiksembilanvalidasi",
  verifyToken,
  getDataRLTigaTitikSembilanValidasi,
);
router.post(
  "/apisirs6v2/rltigatitiksembilanvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikSembilanValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitiksembilanvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikSembilanValidasi,
);

// RL 3.10 Validasi

router.get(
  "/apisirs6v2/rltigatitiksepuluhvalidasi",
  verifyToken,
  getDataRLTigaTitikSepuluhValidasi,
);
router.post(
  "/apisirs6v2/rltigatitiksepuluhvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikSepuluhValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitiksepuluhvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikSepuluhValidasi,
);

// RL 3.11 Validasi

router.get(
  "/apisirs6v2/rltigatitiksebelasvalidasi",
  verifyToken,
  getDataRLTigaTitikSebelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitiksebelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikSebelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitiksebelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikSebelasValidasi,
);

// RL 3.12 Validasi

router.get(
  "/apisirs6v2/rltigatitikduabelasvalidasi",
  verifyToken,
  getDataRLTigaTitikDuaBelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitikduabelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikDuaBelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitikduabelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikDuaBelasValidasi,
);

// RL 3.13 Validasi

router.get(
  "/apisirs6v2/rltigatitiktigabelasvalidasi",
  verifyToken,
  getDataRLTigaTitikTigaBelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitiktigabelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTigaBelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitiktigabelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikTigaBelasValidasi,
);

// RL 3.14 Validasi

router.get(
  "/apisirs6v2/rltigatitikempatbelasvalidasi",
  verifyToken,
  getDataRLTigaTitikEmpatBelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitikempatbelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEmpatBelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitikempatbelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEmpatBelasValidasi,
);

// RL 3.15 Validasi

router.get(
  "/apisirs6v2/rltigatitiklimabelasvalidasi",
  verifyToken,
  getDataRLTigaTitikLimaBelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitiklimabelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikLimaBelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitiklimabelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikLimaBelasValidasi,
);

// RL 3.16 Validasi

router.get(
  "/apisirs6v2/rltigatitikenambelasvalidasi",
  verifyToken,
  getDataRLTigaTitikEnamBelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitikenambelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEnamBelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitikenambelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEnamBelasValidasi,
);

// RL 3.17 Validasi

router.get(
  "/apisirs6v2/rltigatitiktujuhbelasvalidasi",
  verifyToken,
  getDataRLTigaTitikTujuhBelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitiktujuhbelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTujuhBelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitiktujuhbelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikTujuhBelasValidasi,
);

// RL 3.18 Validasi

router.get(
  "/apisirs6v2/rltigatitikdelapanbelasvalidasi",
  verifyToken,
  getDataRLTigaTitikDelapanBelasValidasi,
);
router.post(
  "/apisirs6v2/rltigatitikdelapanbelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikDelapanBelasValidasi,
);
router.patch(
  "/apisirs6v2/rltigatitikdelapanbelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikDelapanBelasValidasi,
);

// RL 3.3
router.post(
  "/apisirs6v2/rltigatitiktiga",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTiga,
);

router.get("/apisirs6v2/rltigatitiktiga", verifyToken, getDataRLTigaTitikTiga);

router.delete(
  "/apisirs6v2/rltigatitiktiga/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikTiga,
);

router.get(
  "/apisirs6v2/rltigatitiktigadetail/:id",
  verifyToken,
  getDataRLTigaTitikTigaById,
);

router.get(
  "/apisirs6v2/cekrltigatitiktigadetail/",
  verifyToken,
  getDataRLTigaTitikTigaDetails,
);

router.patch(
  "/apisirs6v2/rltigatitiktigadetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikTiga,
);

// Jenis Pelayanan RL 3.2
router.get(
  "/apisirs6v2/rltigatitikduajenispelayanan",
  verifyToken,
  getRLTigaTitikDuaJenisPelayanan,
);

// Jenis Pelayanan 3.3
router.get(
  "/apisirs6v2/jenispelayanantigatitiktiga",
  verifyToken,
  getDataJenisPelayananTigaTitikTiga,
);

// Jenis Pengunjung
router.get("/apisirs6v2/jenispengunjung", verifyToken, getDataJenisPengunjung);

// RL 3.4
router.post(
  "/apisirs6v2/rltigatitikempat",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEmpat,
);

router.get(
  "/apisirs6v2/rltigatitikempat",
  verifyToken,
  getDataRLTigaTitikEmpat,
);
router.get(
  "/apisirs6v2/rltigatitikempatdetail/:id",
  verifyToken,
  getRLTigaTitikEmpatById,
);

router.delete(
  "/apisirs6v2/rltigatitikempat/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikEmpat,
);

router.patch(
  "/apisirs6v2/rltigatitikempatdetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEmpat,
);

router.get(
  "/apisirs6v2/rltigatitikempatsatusehat",
  verifyToken,
  getDataRLTigaTitikEmpatSatuSehat,
);

router.get(
  "/apisirs6v2/getDataRLTigaTitikEmpatSatusehatLocal",
  verifyToken,
  getDataRLTigaTitikEmpatSatusehatLocal,
);

// Jenis Kegiatan
router.get(
  "/apisirs6v2/jeniskegiatanrltigatitiklima",
  verifyToken,
  getDataJenisKegiatanRLTigaTitikLima,
);

// RL 3.5
router.post(
  "/apisirs6v2/rltigatitiklima",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikLima,
);

router.get("/apisirs6v2/rltigatitiklima", verifyToken, getDataRLTigaTitikLima);

router.get(
  "/apisirs6v2/rltigatitiklimadetail/:id",
  verifyToken,
  getRLTigaTitikLimaById,
);
router.delete(
  "/apisirs6v2/rltigatitiklima/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikLima,
);
router.patch(
  "/apisirs6v2/rltigatitiklimadetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikLima,
);

router.get(
  "/apisirs6v2/rltigatitiklimasatusehat",
  verifyToken,
  getDataRLTigaTitikLimaSatuSehat
);

// Jenis Kegiatan
router.get(
  "/apisirs6v2/jeniskegiatanrltigatitikenam",
  verifyToken,
  getDataJenisKegiatanRLTigaTitikEnam,
);

// RL 3.6
router.post(
  "/apisirs6v2/rltigatitikenam",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEnam,
);

router.get("/apisirs6v2/rltigatitikenam", verifyToken, getDataRLTigaTitikEnam);

router.get(
  "/apisirs6v2/rltigatitikenamdetail/:id",
  verifyToken,
  getRLTigaTitikEnamById,
);

router.delete(
  "/apisirs6v2/rltigatitikenam/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikEnam,
);

router.patch(
  "/apisirs6v2/rltigatitikenamdetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEnam,
);

// Jenis Kegiatan
router.get(
  "/apisirs6v2/jeniskegiatanrltigatitiktujuh",
  verifyToken,
  getDataJenisKegiatanRLTigaTitikTujuh,
);

// RL 3.7
router.post(
  "/apisirs6v2/rltigatitiktujuh",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTujuh,
);
router.get(
  "/apisirs6v2/rltigatitiktujuh",
  verifyToken,
  getDataRLTigaTitikTujuh,
);
router.get(
  "/apisirs6v2/rltigatitiktujuhdetail/:id",
  verifyToken,
  getRLTigaTitikTujuhById,
);
router.delete(
  "/apisirs6v2/rltigatitiktujuh/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikTujuh,
);
router.patch(
  "/apisirs6v2/rltigatitiktujuhdetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikTujuh,
);

//Jenis Pemeriksaan RL3.8
router.get(
  "/apisirs6v2/rltigatitikdelapanpemeriksaan",
  verifyToken,
  getDataPemeriksaanRlTigaTitikDelapan,
);
router.get(
  "/apisirs6v2/rltigatitikdelapanpemeriksaandetail",
  verifyToken,
  getDataPemeriksaanDetailRlTigaTitikDelapan,
);

// Jenis Kegiatan RL 3.9
router.get(
  "/apisirs6v2/rltigatitiksembilanjeniskegiatan",
  verifyToken,
  getDataJenisKegiatanTigaTitikSembilan,
);

// Jenis Spesialisasi 3.10
router.get(
  "/apisirs6v2/jenisspesialistigatitiksepuluh",
  verifyToken,
  getDataJenisSpesialisTigaTitikSepuluh,
);

// Jenis Kegiatan RL 3.11
router.get(
  "/apisirs6v2/jeniskegiatanrltigatitiksebelas",
  verifyToken,
  getDataJenisKegiatanRLTigaTitikSebelas,
);

// JENIS TINDAKAN RL 3.13
router.get(
  "/apisirs6v2/jenistindakanrltigatitiktigabelas",
  verifyToken,
  getDataJenisTindakanRLTigaTitikTigaBelas,
);

// JENIS TINDAKAN HEADER RL 3.13
router.get(
  "/apisirs6v2/jenistindakanheaderrltigatitiktigabelas",
  verifyToken,
  getDataJenisTindakanHeaderRLTigaTitikTigaBelas,
);

// Golongan Obat 3.17
router.get(
  "/apisirs6v2/rltigatitiktujuhbelasgolonganobat",
  verifyToken,
  getGolonganObatRLTigaTitikTujuhBelas,
);

// Golongan Obat 3.18
router.get(
  "/apisirs6v2/rltigatitikdelapanbelasgolonganobat",
  verifyToken,
  getGolonganObatRLTigaTitikDelapanBelas,
);

// Golongan Obat 3.19 new
router.get(
  "/apisirs6v2/golonganobattigatitiksembilanbelas",
  verifyToken,
  getDataGolonganObatTigaTitikSembilanBelas,
);

// Spesialisasi RL 3.12
router.get(
  "/apisirs6v2/spesialisasirltigatitikduabelas",
  verifyToken,
  getDataSpesialisasiRLTigaTitikDuaBelas,
);

// jenis kegiatan RL 314
router.get(
  "/apisirs6v2/rltigatitikempatbelasjeniskegiatan",
  verifyToken,
  getDataJenisKegiatanRLTigaTitikEmpatBelas,
);

// Jenis Kegiatan 3.15
router.get(
  "/apisirs6v2/jeniskegiatantigatitiklimabelas",
  verifyToken,
  getDataJenisKegiatanTigaTitikLimaBelas,
);

// ICD RL 4
router.get("/apisirs6v2/icd/rawat_inap", verifyToken, getIcdRanap);
router.get("/apisirs6v2/icd/rawat_inap/find", verifyToken, getIcdRanapbySearch);
router.get("/apisirs6v2/icd/rawat_inap/id", verifyToken, getIcdRanapbyId);

// RL 3.8
router.post(
  "/apisirs6v2/rltigatitikdelapan",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikDelapan,
);
router.get(
  "/apisirs6v2/rltigatitikdelapan",
  verifyToken,
  getDataRLTigaTitikDelapanDetailPemeriksaan,
);
router.get(
  "/apisirs6v2/rltigatitikdelapan/:id",
  verifyToken,
  getDataRLTigaTitikDelapanById,
);
router.delete(
  "/apisirs6v2/rltigatitikdelapan/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikDelapan,
);
router.patch(
  "/apisirs6v2/rltigatitikdelapan/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikDelapan,
);

// RL 3.9 Baru
router.post(
  "/apisirs6v2/rltigatitiksembilan",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertRLTigaTitikSembilan,
);
router.get(
  "/apisirs6v2/rltigatitiksembilan",
  verifyToken,
  getRLTigaTitikSembilan,
);
router.delete(
  "/apisirs6v2/rltigatitiksembilan/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteRLTigaTitikSembilan,
);
router.get(
  "/apisirs6v2/rltigatitiksembilan/:id",
  verifyToken,
  showRLTigaTitikSembilan,
);
router.patch(
  "/apisirs6v2/rltigatitiksembilan/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateRLTigaTitikSembilan,
);

// RL 3.10
router.get(
  "/apisirs6v2/rltigatitiksepuluh",
  verifyToken,
  getDataRLTigaTitikSepuluh,
);
router.post(
  "/apisirs6v2/rltigatitiksepuluh",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikSepuluh,
);
router.delete(
  "/apisirs6v2/rltigatitiksepuluh/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikSepuluh,
);
router.get(
  "/apisirs6v2/rltigatitiksepuluhdetail/:id",
  verifyToken,
  getDataRLTigaTitikSepuluhById,
);
router.patch(
  "/apisirs6v2/rltigatitiksepuluhdetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikSepuluh,
);

// RL 3.11
router.post(
  "/apisirs6v2/rltigatitiksebelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikSebelas,
);
router.get(
  "/apisirs6v2/rltigatitiksebelas",
  verifyToken,
  getRLTigaTitikSebelas,
);
router.get(
  "/apisirs6v2/rltigatitiksebelas/:id",
  verifyToken,
  showRLTigaTitikSebelas,
);
router.patch(
  "/apisirs6v2/rltigatitiksebelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikSebelas,
);
router.delete(
  "/apisirs6v2/rltigatitiksebelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikSebelas,
);

// RL 3.12
router.post(
  "/apisirs6v2/rltigatitikduabelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikDuaBelas,
);
router.get(
  "/apisirs6v2/rltigatitikduabelas",
  verifyToken,
  getRLTigaTitikDuaBelas,
);
router.get(
  "/apisirs6v2/rltigatitikduabelas/:id",
  verifyToken,
  showRLTigaTitikDuaBelas,
);
router.patch(
  "/apisirs6v2/rltigatitikduabelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikDuaBelas,
);
router.delete(
  "/apisirs6v2/rltigatitikduabelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikDuaBelas,
);

// RL 3.13
router.post(
  "/apisirs6v2/rltigatitiktigabelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTigaBelas,
);

router.get(
  "/apisirs6v2/rltigatitiktigabelas/",
  verifyToken,
  getRLTigaTitikTigaBelas,
);

router.get(
  "/apisirs6v2/rltigatitiktigabelas/:id",
  verifyToken,
  showRLTigaTitikTigaBelas,
);

router.patch(
  "/apisirs6v2/rltigatitiktigabelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikTigaBelas,
);

router.delete(
  "/apisirs6v2/rltigatitiktigabelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikTigaBelas,
);

// RL 3.14
router.post(
  "/apisirs6v2/rltigatitikempatbelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEmpatBelas,
);
router.get(
  "/apisirs6v2/rltigatitikempatbelas",
  verifyToken,
  getDataRLTigaTitikEmpatBelasDetailKegiatan,
);
router.get(
  "/apisirs6v2/rltigatitikempatbelas/:id",
  verifyToken,
  getDataRLTigaTitikEmpatBelasById,
);
router.delete(
  "/apisirs6v2/rltigatitikempatbelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikEmpatBelas,
);
router.patch(
  "/apisirs6v2/rltigatitikempatbelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEmpatBelas,
);

// RL 3.15
router.get(
  "/apisirs6v2/rltigatitiklimabelas",
  verifyToken,
  getDataRLTigaTitikLimaBelas,
);
router.post(
  "/apisirs6v2/rltigatitiklimabelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikLimaBelas,
);
router.delete(
  "/apisirs6v2/rltigatitiklimabelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikLimaBelas,
);
router.get(
  "/apisirs6v2/rltigatitiklimabelasdetail/:id",
  verifyToken,
  getDataRLTigaTitikLimaBelasById,
);
// router.get(
//   "/apisirs6v2/rltigatitiklimabelasdetail/:id",
//   verifyToken,
//   getDataRLTigaTitikLimaBelasDetails
// );
router.patch(
  "/apisirs6v2/rltigatitiklimabelasdetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikLimaBelas,
);

// RL 3.16
router.get(
  "/apisirs6v2/rltigatitikenambelasjenispelayanankeluargaberencana",
  verifyToken,
  getDataJenisPelayananKeluargaBerencana,
);

router.post(
  "/apisirs6v2/rltigatitikenambelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikEnamBelas,
);

router.get(
  "/apisirs6v2/rltigatitikenambelas/",
  verifyToken,
  getRLTigaTitikEnamBelas,
);

router.get(
  "/apisirs6v2/rltigatitikenambelas/:id",
  verifyToken,
  showRLTigaTitikEnamBelas,
);

router.patch(
  "/apisirs6v2/rltigatitikenambelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikEnamBelas,
);

router.delete(
  "/apisirs6v2/rltigatitikenambelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikEnamBelas,
);

// RL 3.17
router.post(
  "/apisirs6v2/rltigatitiktujuhbelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikTujuhBelas,
);
router.get(
  "/apisirs6v2/rltigatitiktujuhbelas",
  verifyToken,
  getRLTigaTitikTujuhBelas,
);
router.delete(
  "/apisirs6v2/rltigatitiktujuhbelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteRLTigaTitikTujuhBelas,
);
router.get(
  "/apisirs6v2/rltigatitiktujuhbelas/:id",
  verifyToken,
  showRLTigaTitikTujuhBelas,
);
router.patch(
  "/apisirs6v2/rltigatitiktujuhbelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateRLTigaTitikTujuhBelas,
);

// RL 3.18
router.post(
  "/apisirs6v2/rltigatitikdelapanbelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikDelapanBelas,
);
router.get(
  "/apisirs6v2/rltigatitikdelapanbelas",
  verifyToken,
  getRLTigaTitikDelapanBelas,
);
router.delete(
  "/apisirs6v2/rltigatitikdelapanbelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteRLTigaTitikDelapanBelas,
);
router.get(
  "/apisirs6v2/rltigatitikdelapanbelas/:id",
  verifyToken,
  showRLTigaTitikDelapanBelas,
);
router.patch(
  "/apisirs6v2/rltigatitikdelapanbelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateRLTigaTitikDelapanBelas,
);

// RL 3.19 new
router.post(
  "/apisirs6v2/rltigatitiksembilanbelas",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikSembilanBelas,
);

router.get(
  "/apisirs6v2/rltigatitiksembilanbelas",
  verifyToken,
  getDataRLTigaTitikSembilanBelas,
);

router.delete(
  "/apisirs6v2/rltigatitiksembilanbelas/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLTigaTitikSembilanBelas,
);

router.get(
  "/apisirs6v2/rltigatitiksembilanbelasdetail/:id",
  verifyToken,
  getDataRLTigaTitikSembilanBelasById,
);

router.get(
  "/apisirs6v2/cekrltigatitiksembilanbelasdetail/",
  verifyToken,
  getDataRLTigaTitikSembilanBelasDetails,
);

router.patch(
  "/apisirs6v2/rltigatitiksembilanbelasdetail/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikSembilanBelas,
);

// RL 3.19 Validasi
// router.get(
//   "/apisirs6v2/rltigatitiksembilanbelasvalidasi",
//   verifyToken,
//   getDataRLTigaTitikSembilanBelasValidasi
// );
// router.post(
//   "/apisirs6v2/rltigatitiksembilanbelasvalidasi",
//   verifyToken,
//   insertDataRLTigaTitikSembilanBelasValidasi
// );
// router.patch(
//   "/apisirs6v2/rltigatitiksembilanbelasvalidasi/:id",
//   verifyToken,
//   updateDataRLTigaTitikSembilanBelasValidasi
// );

// RL 4.1
router.post(
  "/apisirs6v2/rlempattitiksatu",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLEmpatTitikSatu,
);

router.get(
  "/apisirs6v2/rlempattitiksatu",
  verifyToken,
  getDataRLEmpatTitikSatu,
);

router.get(
  "/apisirs6v2/rlempattitiksatupaging/",
  verifyToken,
  getDataRLEmpatTitikSatuPaging,
);

router.delete(
  "/apisirs6v2/rlempattitiksatu/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLEmpatTitikSatu,
);

router.get(
  "/apisirs6v2/rlempattitiksatu/:id",
  verifyToken,
  getDataRLEmpatTitikSatuById,
);

router.patch(
  "/apisirs6v2/rlempattitiksatu/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLEmpatTitikSatu,
);

router.get(
  "/apisirs6v2/rlempattitiksatusatusehat",
  verifyToken,
  getDataRLEmpatTitikSatuWithSatuSehat,
);

router.get(
  "/apisirs6v2/rlempattitiksatusatusehatSubscribe",
  verifyToken,
  subscribeSyncStatus,
);

// RL 4.2
router.get("/apisirs6v2/rlempattitikdua", verifyToken, getRLEmpatTitikDua);

// RL 4.3
router.get("/apisirs6v2/rlempattitiktiga", verifyToken, getRLEmpatTitikTiga);

// ICD RL 5
// router.get("/apisirs6v2/icd/rawat_jalan", verifyToken, getIcdRajal)

router.get(
  "/apisirs6v2/icd/rawat_jalan/find",
  verifyToken,
  getIcdRajalbySearch,
);

router.get("/apisirs6v2/icd/rawat_jalan/id", verifyToken, getIcdRajalbyId);

// RL 5.1
router.post(
  "/apisirs6v2/rllimatitiksatu",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertdataRLLimaTitikSatu,
);

router.get("/apisirs6v2/rllimatitiksatu", verifyToken, getDataRLLimaTitikSatu);

router.get(
  "/apisirs6v2/rllimatitiksatupaging",
  verifyToken,
  getDataRLLimaTitikSatuPaging,
);

router.get(
  "/apisirs6v2/rllimatitiksatu/:id",
  verifyToken,
  getDataRLLimaTitikSatuById,
);

router.patch(
  "/apisirs6v2/rllimatitiksatu/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLLimaTitikSatu,
);

router.delete(
  "/apisirs6v2/rllimatitiksatu/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  deleteDataRLLimaTitikSatu,
);

router.get(
  "/apisirs6v2/rllimatitiksatusatusehat",
  verifyToken,
  getDataRLLimaTitikSatuSatuSehat,
);

router.get(
  "/apisirs6v2/rllimatitiksatusatusehatshow",
  verifyToken,
  getDataRLLimaTitikSatuSatuSehatShow,
);

router.get(
  "/apisirs6v2/rllimatitiksatusatusehatpage",
  verifyToken,
  getDataRLLimaTitikSatuSatuSehatShowPaging,
);

router.get(
  "/apisirs6v2/getMasterumursatusehat",
  verifyToken,
  getMasterumursatusehat,
);

// RL 5.3
router.get("/apisirs6v2/rllimatitikdua", verifyToken, getRLLimaTitikDua);

// RL 5.3
router.get("/apisirs6v2/rllimatitiktiga", verifyToken, getRLLimatitikTiga);

// ENDPOINT VALIDASI
router.get(
  "/apisirs6v2/rltigatitiksembilanbelasvalidasi",
  verifyToken,
  getDataRLTigaTitikSembilanBelasValidasi,
);

router.post(
  "/apisirs6v2/rltigatitiksembilanbelasvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLTigaTitikSembilanBelasValidasi,
);

router.patch(
  "/apisirs6v2/rltigatitiksembilanbelasvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLTigaTitikSembilanBelasValidasi,
);

router.get(
  "/apisirs6v2/rlempattitiksatuvalidasi",
  verifyToken,
  getDataRLEmpatTitikSatuValidasi,
);

router.post(
  "/apisirs6v2/rlempattitiksatuvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLEmpatTitikSatuValidasi,
);

router.patch(
  "/apisirs6v2/rlempattitiksatuvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLEmpatTitikSatuValidasi,
);

router.get(
  "/apisirs6v2/rlempattitikduavalidasi",
  verifyToken,
  getDataRLEmpatTitikDuaValidasi,
);

router.post(
  "/apisirs6v2/rlempattitikduavalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLEmpatTitikDuaValidasi,
);

router.patch(
  "/apisirs6v2/rlempattitikduavalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLEmpatTitikDuaValidasi,
);

router.get(
  "/apisirs6v2/rlempattitiktigavalidasi",
  verifyToken,
  getDataRLEmpatTitikTigaValidasi,
);

router.post(
  "/apisirs6v2/rlempattitiktigavalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLEmpatTitikTigaValidasi,
);

router.patch(
  "/apisirs6v2/rlempattitiktigavalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLEmpatTitikTigaValidasi,
);

router.get(
  "/apisirs6v2/rllimatitiksatuvalidasi",
  verifyToken,
  getDataRLLimaTitikSatuValidasi,
);

router.post(
  "/apisirs6v2/rllimatitiksatuvalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLLimaTitikSatuValidasi,
);

router.patch(
  "/apisirs6v2/rllimatitiksatuvalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLLimaTitikSatuValidasi,
);

router.get(
  "/apisirs6v2/rllimatitikduavalidasi",
  verifyToken,
  getDataRLLimaTitikDuaValidasi,
);

router.post(
  "/apisirs6v2/rllimatitikduavalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLLimaTitikDuaValidasi,
);

router.patch(
  "/apisirs6v2/rllimatitikduavalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLLimaTitikDuaValidasi,
);

router.get(
  "/apisirs6v2/rllimatitiktigavalidasi",
  verifyToken,
  getDataRLLimaTitikTigaValidasi,
);

router.post(
  "/apisirs6v2/rllimatitiktigavalidasi",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  insertDataRLLimaTitikTigaValidasi,
);

router.patch(
  "/apisirs6v2/rllimatitiktigavalidasi/:id",
  verifyCsrfToken,
  verifyToken,
  verifyHmac,
  updateDataRLLimaTitikTigaValidasi,
);

export default router;
