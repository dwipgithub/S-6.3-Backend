import { DataTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";

export const SatsetPilotRs = databaseSIRS.define("satset_pilot_rs", {
  rs_id: { type: DataTypes.STRING },
  provinsi_id: { type: DataTypes.STRING },
  kab_kota_id: { type: DataTypes.STRING },
  is_active: { type: DataTypes.INTEGER },
});
