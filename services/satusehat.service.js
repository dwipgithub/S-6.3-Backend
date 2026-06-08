// services/satusehat.service.js
import axios from "axios";

const BASE_URL = process.env.SATUSEHAT_BASE_URL;
const API_KEY = process.env.SATUSEHAT_API_KEY;

export const fetchRL41FromSatuSehat = async (organization_id, periode) => {
  const res = await axios.get(`${BASE_URL}/v1/rlreport/rl41`, {
    headers: { "X-API-Key": API_KEY },
    params: { bulan_laporan: periode, organization_id },
    timeout: 30000,
  });
  return res.data;
};
