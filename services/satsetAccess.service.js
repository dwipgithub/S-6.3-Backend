import { StatusSatset } from "../models/StatusSatset.js";
import { SatsetPilotRs } from "../models/SatsetPilotRs.js";
// services/satsetAccess.service.js

export const canAccessSatset = async (user) => {
  const cfg = await StatusSatset.findOne({ attributes: ["status_satset"] });
  const mode = cfg?.status_satset ?? 0;

  if (mode === 0) return false;
  if (mode === 2) return true;
  // mode 1 = pilot
  const { jenisUserId, satKerId } = user;
  if (jenisUserId == 1) return true;

  const where = { is_active: 1 };
  if (jenisUserId == 2) where.provinsi_id = satKerId;
  else if (jenisUserId == 3) where.kab_kota_id = satKerId;
  else if (jenisUserId == 4) where.rs_id = satKerId;
  else return false;

  return (await SatsetPilotRs.count({ where })) > 0;
};
