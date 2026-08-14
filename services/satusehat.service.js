// services/satusehat.service.js
import axios from "axios";

const BASE_URL = process.env.SATUSEHAT_BASE_URL;
const API_KEY = process.env.SATUSEHAT_API_KEY;

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

export const fetchRL41FromSatuSehat = async (organization_id, periode) => {
  const res = await axios.get(`${BASE_URL}/rl41`, {
    headers: { "X-API-Key": API_KEY },
    params: { bulan_laporan: periode, organization_id },
    timeout: 60000,
  });

  return res.data;
};

export const fetchRL51FromSatuSehat = async (organization_id, periode) => {
  const res = await axios.get(`${BASE_URL}/rl51`, {
    headers: { "X-API-Key": API_KEY },
    params: { month: periode, organization_id },
    timeout: 60000,
  });

  return res.data;
};
