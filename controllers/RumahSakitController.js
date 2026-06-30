import axios from "axios";
import dotenv from "dotenv";
import { get } from "../models/RumahSakitModel.js";
dotenv.config();

// export const getRumahSakit = async (req, res) => {
//   try {
//     const baseUrl = process.env.API_FASKES;
//     const username = process.env.username_API_FASKES;
//     const password = process.env.password_API_FASKES;

//     const loginResponse = await axios.post(
//       `${baseUrl}/faskes/login`,
//       {
//         userName: username,
//         password: password,
//       },
//       {
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//     const token =
//       loginResponse.data.access_token || loginResponse.data.data.access_token;

//     const response = await axios.get(`${baseUrl}/faskes/rumahsakit`, {
//       params: {
//         provinsiId: req.query.provinsiId,
//         kabKotaId: req.query.kabKotaId,
//         nama: req.query.namaRs,
//         page: req.query.page || 1,
//         limit: req.query.limit || 1000,
//       },
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const rsList = response.data.data
//       ? response.data.data.filter((item) => item.statusAktivasi == 1)
//       : [];

//     const data = rsList.map((item) => ({
//       id: item.kode,
//       nama: item.nama,
//       alamat: item.alamat,
//       kab_kota_nama: item.kabKotaNama,
//       provinsi_nama: item.provinsiNama,
//     }));

//     const message = data.length ? "data found" : "data not found";
//     res.status(200).send({
//       status: true,
//       message: message,
//       data: data,
//     });
//   } catch (error) {
//     res.status(500).send({
//       status: false,
//       message: error.message,
//     });
//   }
// };

export const getRumahSakit = (req, res) => {
  get(req, (err, results) => {
    const message = results.length ? "data found" : "data not found";
    res.status(200).send({
      status: true,
      message: message,
      data: results,
    });
  });
};

export const showRumahSakit = async (req, res) => {
  try {
    const baseUrl = process.env.API_FASKES;
    const username = process.env.username_API_FASKES;
    const password = process.env.password_API_FASKES;

    const loginResponse = await axios.post(
      `${baseUrl}/faskes/login`,
      {
        userName: username,
        password: password,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    const token =
      loginResponse.data.access_token || loginResponse.data.data.access_token;

    const response = await axios.get(
      `${baseUrl}/faskes/rumahsakit/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const apiData = response.data.data;
    const data = {
      id: apiData.kode,
      nama: apiData.nama,
      alamat: apiData.alamat,
      provinsi_nama: apiData.provinsiNama,
      kab_kota_nama: apiData.kabKotaNama,
    };

    res.status(200).send({
      status: true,
      message: "data found",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};
