// services/satusehat.service.js
import axios from "axios";

const BASE_URL = process.env.SATUSEHAT_BASE_URL;
const API_KEY = process.env.SATUSEHAT_API_KEY;


export const fetchRL38FromSatuSehat = async (organization_id, periode) => {
  const res = await axios.get(`${BASE_URL}/rl38`, {
    headers: { "X-API-Key": API_KEY },
    params: { bulan_laporan: periode, organization_id },
    timeout: 60000,
  });

  return res.data;
};

export const fetchRL39FromSatuSehat = async (organization_id, periode) => {
  const res = await axios.get(`${BASE_URL}/rl39`, {
    headers: { "X-API-Key": API_KEY },
    params: { bulan_laporan: periode, organization_id },
    timeout: 60000,
  });

  return res.data;
};

export const fetchRL310FromSatuSehat = async (organization_id, periode) => {
  const res = await axios.get(`${BASE_URL}/rl310`, {
    headers: { "X-API-Key": API_KEY },
    params: { bulan_laporan: periode, organization_id },
    timeout: 60000,
  });

  return res.data;
};

export const fetchRL311FromSatuSehat = async (organization_id, year) => {
  const res = await axios.get(`${BASE_URL}/rl311`, {
    headers: { "X-API-Key": API_KEY },
    params: { year, organization_id },
    timeout: 60000,
  });

  return res.data;
};

export const fetchRL312FromSatuSehat = async (organization_id, periode) => {
  const res = await axios.get(`${BASE_URL}/rl312`, {
    headers: { "X-API-Key": API_KEY },
    params: { bulan_laporan: periode, organization_id },
    timeout: 60000,
  });

  return res.data;
};

export const fetchRL317FromSatuSehat = async (organization_id, year) => {
  const res = await axios.get(`${BASE_URL}/rl317`, {
    headers: { "X-API-Key": API_KEY },
    params: { year, organization_id },
    timeout: 60000,
  });

  return res.data;
};

export const fetchRL318FromSatuSehat = async (organization_id, year) => {
  const res = await axios.get(`${BASE_URL}/rl318`, {
    headers: { "X-API-Key": API_KEY },
    params: { year, organization_id },
    timeout: 60000,
  });

  return res.data;
};

// Helper fungsi retry otomatis saat terjadi timeout
const fetchWithRetry = async (url, config, retries = 3, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.get(url, config);
    } catch (error) {
      const isTimeout =
        error.code === "ECONNABORTED" || error.message.includes("timeout");

      if (isTimeout && attempt < retries) {
        console.warn(
          `[SATUSEHAT] Timeout pada percobaan ke-\({attempt}. Mencoba ulang dalam\){delay / 1000} detik...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay * attempt)); // Jeda meningkat bertahap
      } else {
        throw error;
      }
    }
  }
};

export const fetchRL41FromSatuSehat = async (organization_id, periode) => {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/rl41`, {
      headers: { "X-API-Key": API_KEY },
      params: { bulan_laporan: periode, organization_id },
      timeout: 120000, // Naikkan batas ke 120 detik
    });
    return res.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(
        `[RL4.1] Server SATUSEHAT tidak merespons dalam waktu 120 detik.`,
      );
    }
    throw error;
  }
};

export const fetchRL51FromSatuSehat = async (organization_id, periode) => {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/rl51`, {
      headers: { "X-API-Key": API_KEY },
      params: { month: periode, organization_id },
      timeout: 120000, // Naikkan batas ke 120 detik
    });
    return res.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(
        `[RL5.1] Server SATUSEHAT tidak merespons dalam waktu 120 detik.`,
      );
    }
    throw error;
  }
};
