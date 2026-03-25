import { DataTypes, QueryTypes } from "sequelize";
import { databaseSIRS } from "../config/Database.js";

// export const get = (req, callback) => {
//   const sqlSelect =
//     "SELECT " +
//     "rs_id, " +
//     "CASE " +
//     "WHEN ROUND (( " +
//     "rl_31_bulan_1 + rl_31_bulan_2 + rl_31_bulan_3 + rl_31_bulan_4 + rl_31_bulan_5 + rl_31_bulan_6 + rl_31_bulan_7 + rl_31_bulan_8 + rl_31_bulan_9 + rl_31_bulan_10 + rl_31_bulan_11 + rl_31_bulan_12 + " +
//     "rl_32_bulan_1 + rl_32_bulan_2 + rl_32_bulan_3 + rl_32_bulan_4 + rl_32_bulan_5 + rl_32_bulan_6 + rl_32_bulan_7 + rl_32_bulan_8 + rl_32_bulan_9 + rl_32_bulan_10 + rl_32_bulan_11 + rl_32_bulan_12 + " +
//     "rl_33_bulan_1 + rl_33_bulan_2 + rl_33_bulan_3 + rl_33_bulan_4 + rl_33_bulan_5 + rl_33_bulan_6 + rl_33_bulan_7 + rl_33_bulan_8 + rl_33_bulan_9 + rl_33_bulan_10 + rl_33_bulan_11 + rl_33_bulan_12 + " +
//     "rl_34_bulan_1 + rl_34_bulan_2 + rl_34_bulan_3 + rl_34_bulan_4 + rl_34_bulan_5 + rl_34_bulan_6 + rl_34_bulan_7 + rl_34_bulan_8 + rl_34_bulan_9 + rl_34_bulan_10 + rl_34_bulan_11 + rl_34_bulan_12 + " +
//     "rl_35_bulan_1 + rl_35_bulan_2 + rl_35_bulan_3 + rl_35_bulan_4 + rl_35_bulan_5 + rl_35_bulan_6 + rl_35_bulan_7 + rl_35_bulan_8 + rl_35_bulan_9 + rl_35_bulan_10 + rl_35_bulan_11 + rl_35_bulan_12 + " +
//     "rl_36_bulan_1 + rl_36_bulan_2 + rl_36_bulan_3 + rl_36_bulan_4 + rl_36_bulan_5 + rl_36_bulan_6 + rl_36_bulan_7 + rl_36_bulan_8 + rl_36_bulan_9 + rl_36_bulan_10 + rl_36_bulan_11 + rl_36_bulan_12 + " +
//     "rl_37_bulan_1 + rl_37_bulan_2 + rl_37_bulan_3 + rl_37_bulan_4 + rl_37_bulan_5 + rl_37_bulan_6 + rl_37_bulan_7 + rl_37_bulan_8 + rl_37_bulan_9 + rl_37_bulan_10 + rl_37_bulan_11 + rl_37_bulan_12 + " +
//     "rl_38_bulan_1 + rl_38_bulan_2 + rl_38_bulan_3 + rl_38_bulan_4 + rl_38_bulan_5 + rl_38_bulan_6 + rl_38_bulan_7 + rl_38_bulan_8 + rl_38_bulan_9 + rl_38_bulan_10 + rl_38_bulan_11 + rl_38_bulan_12 + " +
//     "rl_39_bulan_1 + rl_39_bulan_2 + rl_39_bulan_3 + rl_39_bulan_4 + rl_39_bulan_5 + rl_39_bulan_6 + rl_39_bulan_7 + rl_39_bulan_8 + rl_39_bulan_9 + rl_39_bulan_10 + rl_39_bulan_11 + rl_39_bulan_12 + " +
//     "rl_310_bulan_1 + rl_310_bulan_2 + rl_310_bulan_3 + rl_310_bulan_4 + rl_310_bulan_5 + rl_310_bulan_6 + rl_310_bulan_7 + rl_310_bulan_8 + rl_310_bulan_9 + rl_310_bulan_10 + rl_310_bulan_11 + rl_310_bulan_12 + " +
//     "rl_311 + " +
//     "rl_312_bulan_1 + rl_312_bulan_2 + rl_312_bulan_3 + rl_312_bulan_4 + rl_312_bulan_5 + rl_312_bulan_6 + rl_312_bulan_7 + rl_312_bulan_8 + rl_312_bulan_9 + rl_312_bulan_10 + rl_312_bulan_11 + rl_312_bulan_12 + " +
//     "rl_313 + " +
//     "rl_314_bulan_1 + rl_314_bulan_2 + rl_314_bulan_3 + rl_314_bulan_4 + rl_314_bulan_5 + rl_314_bulan_6 + rl_314_bulan_7 + rl_314_bulan_8 + rl_314_bulan_9 + rl_314_bulan_10 + rl_314_bulan_11 + rl_314_bulan_12 + " +
//     "rl_315 + rl_316 + rl_317 + rl_318 + rl_319 + " +
//     "rl_41_bulan_1 + rl_41_bulan_2 + rl_41_bulan_3 + rl_41_bulan_4 + rl_41_bulan_5 + rl_41_bulan_6 + rl_41_bulan_7 + rl_41_bulan_8 + rl_41_bulan_9 + rl_41_bulan_10 + rl_41_bulan_11 + rl_41_bulan_12 + " +
//     "rl_42_bulan_1 + rl_42_bulan_2 + rl_42_bulan_3 + rl_42_bulan_4 + rl_42_bulan_5 + rl_42_bulan_6 + rl_42_bulan_7 + rl_42_bulan_8 + rl_42_bulan_9 + rl_42_bulan_10 + rl_42_bulan_11 + rl_42_bulan_12 + " +
//     "rl_43_bulan_1 + rl_43_bulan_2 + rl_43_bulan_3 + rl_43_bulan_4 + rl_43_bulan_5 + rl_43_bulan_6 + rl_43_bulan_7 + rl_43_bulan_8 + rl_43_bulan_9 + rl_43_bulan_10 + rl_43_bulan_11 + rl_43_bulan_12 + " +
//     "rl_51_bulan_1 + rl_51_bulan_2 + rl_51_bulan_3 + rl_51_bulan_4 + rl_51_bulan_5 + rl_51_bulan_6 + rl_51_bulan_7 + rl_51_bulan_8 + rl_51_bulan_9 + rl_51_bulan_10 + rl_51_bulan_11 + rl_51_bulan_12 + " +
//     "rl_52_bulan_1 + rl_52_bulan_2 + rl_52_bulan_3 + rl_52_bulan_4 + rl_52_bulan_5 + rl_52_bulan_6 + rl_52_bulan_7 + rl_52_bulan_8 + rl_52_bulan_9 + rl_52_bulan_10 + rl_52_bulan_11 + rl_52_bulan_12 + " +
//     "rl_53_bulan_1 + rl_53_bulan_2 + rl_53_bulan_3 + rl_53_bulan_4 + rl_53_bulan_5 + rl_53_bulan_6 + rl_53_bulan_7 + rl_53_bulan_8 + rl_53_bulan_9 + rl_53_bulan_10 + rl_53_bulan_11 + rl_53_bulan_12 " +
//     ") * 100 / 223, 2) = 100 " +
//     "THEN 100 " +
//     "WHEN ROUND (( " +
//     "rl_31_bulan_1 + rl_31_bulan_2 + rl_31_bulan_3 + rl_31_bulan_4 + rl_31_bulan_5 + rl_31_bulan_6 + rl_31_bulan_7 + rl_31_bulan_8 + rl_31_bulan_9 + rl_31_bulan_10 + rl_31_bulan_11 + rl_31_bulan_12 + " +
//     "rl_32_bulan_1 + rl_32_bulan_2 + rl_32_bulan_3 + rl_32_bulan_4 + rl_32_bulan_5 + rl_32_bulan_6 + rl_32_bulan_7 + rl_32_bulan_8 + rl_32_bulan_9 + rl_32_bulan_10 + rl_32_bulan_11 + rl_32_bulan_12 + " +
//     "rl_33_bulan_1 + rl_33_bulan_2 + rl_33_bulan_3 + rl_33_bulan_4 + rl_33_bulan_5 + rl_33_bulan_6 + rl_33_bulan_7 + rl_33_bulan_8 + rl_33_bulan_9 + rl_33_bulan_10 + rl_33_bulan_11 + rl_33_bulan_12 + " +
//     "rl_34_bulan_1 + rl_34_bulan_2 + rl_34_bulan_3 + rl_34_bulan_4 + rl_34_bulan_5 + rl_34_bulan_6 + rl_34_bulan_7 + rl_34_bulan_8 + rl_34_bulan_9 + rl_34_bulan_10 + rl_34_bulan_11 + rl_34_bulan_12 + " +
//     "rl_35_bulan_1 + rl_35_bulan_2 + rl_35_bulan_3 + rl_35_bulan_4 + rl_35_bulan_5 + rl_35_bulan_6 + rl_35_bulan_7 + rl_35_bulan_8 + rl_35_bulan_9 + rl_35_bulan_10 + rl_35_bulan_11 + rl_35_bulan_12 + " +
//     "rl_36_bulan_1 + rl_36_bulan_2 + rl_36_bulan_3 + rl_36_bulan_4 + rl_36_bulan_5 + rl_36_bulan_6 + rl_36_bulan_7 + rl_36_bulan_8 + rl_36_bulan_9 + rl_36_bulan_10 + rl_36_bulan_11 + rl_36_bulan_12 + " +
//     "rl_37_bulan_1 + rl_37_bulan_2 + rl_37_bulan_3 + rl_37_bulan_4 + rl_37_bulan_5 + rl_37_bulan_6 + rl_37_bulan_7 + rl_37_bulan_8 + rl_37_bulan_9 + rl_37_bulan_10 + rl_37_bulan_11 + rl_37_bulan_12 + " +
//     "rl_38_bulan_1 + rl_38_bulan_2 + rl_38_bulan_3 + rl_38_bulan_4 + rl_38_bulan_5 + rl_38_bulan_6 + rl_38_bulan_7 + rl_38_bulan_8 + rl_38_bulan_9 + rl_38_bulan_10 + rl_38_bulan_11 + rl_38_bulan_12 + " +
//     "rl_39_bulan_1 + rl_39_bulan_2 + rl_39_bulan_3 + rl_39_bulan_4 + rl_39_bulan_5 + rl_39_bulan_6 + rl_39_bulan_7 + rl_39_bulan_8 + rl_39_bulan_9 + rl_39_bulan_10 + rl_39_bulan_11 + rl_39_bulan_12 + " +
//     "rl_310_bulan_1 + rl_310_bulan_2 + rl_310_bulan_3 + rl_310_bulan_4 + rl_310_bulan_5 + rl_310_bulan_6 + rl_310_bulan_7 + rl_310_bulan_8 + rl_310_bulan_9 + rl_310_bulan_10 + rl_310_bulan_11 + rl_310_bulan_12 + " +
//     "rl_311 + " +
//     "rl_312_bulan_1 + rl_312_bulan_2 + rl_312_bulan_3 + rl_312_bulan_4 + rl_312_bulan_5 + rl_312_bulan_6 + rl_312_bulan_7 + rl_312_bulan_8 + rl_312_bulan_9 + rl_312_bulan_10 + rl_312_bulan_11 + rl_312_bulan_12 + " +
//     "rl_313 + " +
//     "rl_314_bulan_1 + rl_314_bulan_2 + rl_314_bulan_3 + rl_314_bulan_4 + rl_314_bulan_5 + rl_314_bulan_6 + rl_314_bulan_7 + rl_314_bulan_8 + rl_314_bulan_9 + rl_314_bulan_10 + rl_314_bulan_11 + rl_314_bulan_12 + " +
//     "rl_315 + rl_316 + rl_317 + rl_318 + rl_319 + " +
//     "rl_41_bulan_1 + rl_41_bulan_2 + rl_41_bulan_3 + rl_41_bulan_4 + rl_41_bulan_5 + rl_41_bulan_6 + rl_41_bulan_7 + rl_41_bulan_8 + rl_41_bulan_9 + rl_41_bulan_10 + rl_41_bulan_11 + rl_41_bulan_12 + " +
//     "rl_42_bulan_1 + rl_42_bulan_2 + rl_42_bulan_3 + rl_42_bulan_4 + rl_42_bulan_5 + rl_42_bulan_6 + rl_42_bulan_7 + rl_42_bulan_8 + rl_42_bulan_9 + rl_42_bulan_10 + rl_42_bulan_11 + rl_42_bulan_12 + " +
//     "rl_43_bulan_1 + rl_43_bulan_2 + rl_43_bulan_3 + rl_43_bulan_4 + rl_43_bulan_5 + rl_43_bulan_6 + rl_43_bulan_7 + rl_43_bulan_8 + rl_43_bulan_9 + rl_43_bulan_10 + rl_43_bulan_11 + rl_43_bulan_12 + " +
//     "rl_51_bulan_1 + rl_51_bulan_2 + rl_51_bulan_3 + rl_51_bulan_4 + rl_51_bulan_5 + rl_51_bulan_6 + rl_51_bulan_7 + rl_51_bulan_8 + rl_51_bulan_9 + rl_51_bulan_10 + rl_51_bulan_11 + rl_51_bulan_12 + " +
//     "rl_52_bulan_1 + rl_52_bulan_2 + rl_52_bulan_3 + rl_52_bulan_4 + rl_52_bulan_5 + rl_52_bulan_6 + rl_52_bulan_7 + rl_52_bulan_8 + rl_52_bulan_9 + rl_52_bulan_10 + rl_52_bulan_11 + rl_52_bulan_12 + " +
//     "rl_53_bulan_1 + rl_53_bulan_2 + rl_53_bulan_3 + rl_53_bulan_4 + rl_53_bulan_5 + rl_53_bulan_6 + rl_53_bulan_7 + rl_53_bulan_8 + rl_53_bulan_9 + rl_53_bulan_10 + rl_53_bulan_11 + rl_53_bulan_12 " +
//     ") * 100 / 223, 2) = 0 " +
//     "THEN 100 " +
//     "ELSE ROUND (( " +
//     "rl_31_bulan_1 + rl_31_bulan_2 + rl_31_bulan_3 + rl_31_bulan_4 + rl_31_bulan_5 + rl_31_bulan_6 + rl_31_bulan_7 + rl_31_bulan_8 + rl_31_bulan_9 + rl_31_bulan_10 + rl_31_bulan_11 + rl_31_bulan_12 + " +
//     "rl_32_bulan_1 + rl_32_bulan_2 + rl_32_bulan_3 + rl_32_bulan_4 + rl_32_bulan_5 + rl_32_bulan_6 + rl_32_bulan_7 + rl_32_bulan_8 + rl_32_bulan_9 + rl_32_bulan_10 + rl_32_bulan_11 + rl_32_bulan_12 + " +
//     "rl_33_bulan_1 + rl_33_bulan_2 + rl_33_bulan_3 + rl_33_bulan_4 + rl_33_bulan_5 + rl_33_bulan_6 + rl_33_bulan_7 + rl_33_bulan_8 + rl_33_bulan_9 + rl_33_bulan_10 + rl_33_bulan_11 + rl_33_bulan_12 + " +
//     "rl_34_bulan_1 + rl_34_bulan_2 + rl_34_bulan_3 + rl_34_bulan_4 + rl_34_bulan_5 + rl_34_bulan_6 + rl_34_bulan_7 + rl_34_bulan_8 + rl_34_bulan_9 + rl_34_bulan_10 + rl_34_bulan_11 + rl_34_bulan_12 + " +
//     "rl_35_bulan_1 + rl_35_bulan_2 + rl_35_bulan_3 + rl_35_bulan_4 + rl_35_bulan_5 + rl_35_bulan_6 + rl_35_bulan_7 + rl_35_bulan_8 + rl_35_bulan_9 + rl_35_bulan_10 + rl_35_bulan_11 + rl_35_bulan_12 + " +
//     "rl_36_bulan_1 + rl_36_bulan_2 + rl_36_bulan_3 + rl_36_bulan_4 + rl_36_bulan_5 + rl_36_bulan_6 + rl_36_bulan_7 + rl_36_bulan_8 + rl_36_bulan_9 + rl_36_bulan_10 + rl_36_bulan_11 + rl_36_bulan_12 + " +
//     "rl_37_bulan_1 + rl_37_bulan_2 + rl_37_bulan_3 + rl_37_bulan_4 + rl_37_bulan_5 + rl_37_bulan_6 + rl_37_bulan_7 + rl_37_bulan_8 + rl_37_bulan_9 + rl_37_bulan_10 + rl_37_bulan_11 + rl_37_bulan_12 + " +
//     "rl_38_bulan_1 + rl_38_bulan_2 + rl_38_bulan_3 + rl_38_bulan_4 + rl_38_bulan_5 + rl_38_bulan_6 + rl_38_bulan_7 + rl_38_bulan_8 + rl_38_bulan_9 + rl_38_bulan_10 + rl_38_bulan_11 + rl_38_bulan_12 + " +
//     "rl_39_bulan_1 + rl_39_bulan_2 + rl_39_bulan_3 + rl_39_bulan_4 + rl_39_bulan_5 + rl_39_bulan_6 + rl_39_bulan_7 + rl_39_bulan_8 + rl_39_bulan_9 + rl_39_bulan_10 + rl_39_bulan_11 + rl_39_bulan_12 + " +
//     "rl_310_bulan_1 + rl_310_bulan_2 + rl_310_bulan_3 + rl_310_bulan_4 + rl_310_bulan_5 + rl_310_bulan_6 + rl_310_bulan_7 + rl_310_bulan_8 + rl_310_bulan_9 + rl_310_bulan_10 + rl_310_bulan_11 + rl_310_bulan_12 + " +
//     "rl_311 + " +
//     "rl_312_bulan_1 + rl_312_bulan_2 + rl_312_bulan_3 + rl_312_bulan_4 + rl_312_bulan_5 + rl_312_bulan_6 + rl_312_bulan_7 + rl_312_bulan_8 + rl_312_bulan_9 + rl_312_bulan_10 + rl_312_bulan_11 + rl_312_bulan_12 + " +
//     "rl_313 + " +
//     "rl_314_bulan_1 + rl_314_bulan_2 + rl_314_bulan_3 + rl_314_bulan_4 + rl_314_bulan_5 + rl_314_bulan_6 + rl_314_bulan_7 + rl_314_bulan_8 + rl_314_bulan_9 + rl_314_bulan_10 + rl_314_bulan_11 + rl_314_bulan_12 + " +
//     "rl_315 + rl_316 + rl_317 + rl_318 + rl_319 + " +
//     "rl_41_bulan_1 + rl_41_bulan_2 + rl_41_bulan_3 + rl_41_bulan_4 + rl_41_bulan_5 + rl_41_bulan_6 + rl_41_bulan_7 + rl_41_bulan_8 + rl_41_bulan_9 + rl_41_bulan_10 + rl_41_bulan_11 + rl_41_bulan_12 + " +
//     "rl_42_bulan_1 + rl_42_bulan_2 + rl_42_bulan_3 + rl_42_bulan_4 + rl_42_bulan_5 + rl_42_bulan_6 + rl_42_bulan_7 + rl_42_bulan_8 + rl_42_bulan_9 + rl_42_bulan_10 + rl_42_bulan_11 + rl_42_bulan_12 + " +
//     "rl_43_bulan_1 + rl_43_bulan_2 + rl_43_bulan_3 + rl_43_bulan_4 + rl_43_bulan_5 + rl_43_bulan_6 + rl_43_bulan_7 + rl_43_bulan_8 + rl_43_bulan_9 + rl_43_bulan_10 + rl_43_bulan_11 + rl_43_bulan_12 + " +
//     "rl_51_bulan_1 + rl_51_bulan_2 + rl_51_bulan_3 + rl_51_bulan_4 + rl_51_bulan_5 + rl_51_bulan_6 + rl_51_bulan_7 + rl_51_bulan_8 + rl_51_bulan_9 + rl_51_bulan_10 + rl_51_bulan_11 + rl_51_bulan_12 + " +
//     "rl_52_bulan_1 + rl_52_bulan_2 + rl_52_bulan_3 + rl_52_bulan_4 + rl_52_bulan_5 + rl_52_bulan_6 + rl_52_bulan_7 + rl_52_bulan_8 + rl_52_bulan_9 + rl_52_bulan_10 + rl_52_bulan_11 + rl_52_bulan_12 + " +
//     "rl_53_bulan_1 + rl_53_bulan_2 + rl_53_bulan_3 + rl_53_bulan_4 + rl_53_bulan_5 + rl_53_bulan_6 + rl_53_bulan_7 + rl_53_bulan_8 + rl_53_bulan_9 + rl_53_bulan_10 + rl_53_bulan_11 + rl_53_bulan_12 " +
//     ") * 100 / 223, 2) " +
//     "END AS persentase_pengisian, " +
//     "rl_31_bulan_1, " +
//     "rl_31_bulan_2, " +
//     "rl_31_bulan_3, " +
//     "rl_31_bulan_4, " +
//     "rl_31_bulan_5, " +
//     "rl_31_bulan_6, " +
//     "rl_31_bulan_7, " +
//     "rl_31_bulan_8, " +
//     "rl_31_bulan_9, " +
//     "rl_31_bulan_10, " +
//     "rl_31_bulan_11, " +
//     "rl_31_bulan_12, " +
//     "rl_32_bulan_1, " +
//     "rl_32_bulan_2, " +
//     "rl_32_bulan_3, " +
//     "rl_32_bulan_4, " +
//     "rl_32_bulan_5, " +
//     "rl_32_bulan_6, " +
//     "rl_32_bulan_7, " +
//     "rl_32_bulan_8, " +
//     "rl_32_bulan_9, " +
//     "rl_32_bulan_10, " +
//     "rl_32_bulan_11, " +
//     "rl_32_bulan_12, " +
//     "rl_33_bulan_1, " +
//     "rl_33_bulan_2, " +
//     "rl_33_bulan_3, " +
//     "rl_33_bulan_4, " +
//     "rl_33_bulan_5, " +
//     "rl_33_bulan_6, " +
//     "rl_33_bulan_7, " +
//     "rl_33_bulan_8, " +
//     "rl_33_bulan_9, " +
//     "rl_33_bulan_10, " +
//     "rl_33_bulan_11, " +
//     "rl_33_bulan_12, " +
//     "rl_34_bulan_1, " +
//     "rl_34_bulan_2, " +
//     "rl_34_bulan_3, " +
//     "rl_34_bulan_4, " +
//     "rl_34_bulan_5, " +
//     "rl_34_bulan_6, " +
//     "rl_34_bulan_7, " +
//     "rl_34_bulan_8, " +
//     "rl_34_bulan_9, " +
//     "rl_34_bulan_10, " +
//     "rl_34_bulan_11, " +
//     "rl_34_bulan_12, " +
//     "rl_35_bulan_1, " +
//     "rl_35_bulan_2, " +
//     "rl_35_bulan_3, " +
//     "rl_35_bulan_4, " +
//     "rl_35_bulan_5, " +
//     "rl_35_bulan_6, " +
//     "rl_35_bulan_7, " +
//     "rl_35_bulan_8, " +
//     "rl_35_bulan_9, " +
//     "rl_35_bulan_10, " +
//     "rl_35_bulan_11, " +
//     "rl_35_bulan_12, " +
//     "rl_36_bulan_1, " +
//     "rl_36_bulan_2, " +
//     "rl_36_bulan_3, " +
//     "rl_36_bulan_4, " +
//     "rl_36_bulan_5, " +
//     "rl_36_bulan_6, " +
//     "rl_36_bulan_7, " +
//     "rl_36_bulan_8, " +
//     "rl_36_bulan_9, " +
//     "rl_36_bulan_10, " +
//     "rl_36_bulan_11, " +
//     "rl_36_bulan_12, " +
//     "rl_37_bulan_1, " +
//     "rl_37_bulan_2, " +
//     "rl_37_bulan_3, " +
//     "rl_37_bulan_4, " +
//     "rl_37_bulan_5, " +
//     "rl_37_bulan_6, " +
//     "rl_37_bulan_7, " +
//     "rl_37_bulan_8, " +
//     "rl_37_bulan_9, " +
//     "rl_37_bulan_10, " +
//     "rl_37_bulan_11, " +
//     "rl_37_bulan_12, " +
//     "rl_38_bulan_1, " +
//     "rl_38_bulan_2, " +
//     "rl_38_bulan_3, " +
//     "rl_38_bulan_4, " +
//     "rl_38_bulan_5, " +
//     "rl_38_bulan_6, " +
//     "rl_38_bulan_7, " +
//     "rl_38_bulan_8, " +
//     "rl_38_bulan_9, " +
//     "rl_38_bulan_10, " +
//     "rl_38_bulan_11, " +
//     "rl_38_bulan_12, " +
//     "rl_39_bulan_1, " +
//     "rl_39_bulan_2, " +
//     "rl_39_bulan_3, " +
//     "rl_39_bulan_4, " +
//     "rl_39_bulan_5, " +
//     "rl_39_bulan_6, " +
//     "rl_39_bulan_7, " +
//     "rl_39_bulan_8, " +
//     "rl_39_bulan_9, " +
//     "rl_39_bulan_10, " +
//     "rl_39_bulan_11, " +
//     "rl_39_bulan_12, " +
//     "rl_310_bulan_1, " +
//     "rl_310_bulan_2, " +
//     "rl_310_bulan_3, " +
//     "rl_310_bulan_4, " +
//     "rl_310_bulan_5, " +
//     "rl_310_bulan_6, " +
//     "rl_310_bulan_7, " +
//     "rl_310_bulan_8, " +
//     "rl_310_bulan_9, " +
//     "rl_310_bulan_10, " +
//     "rl_310_bulan_11, " +
//     "rl_310_bulan_12, " +
//     "rl_311, " +
//     "rl_312_bulan_1, " +
//     "rl_312_bulan_2, " +
//     "rl_312_bulan_3, " +
//     "rl_312_bulan_4, " +
//     "rl_312_bulan_5, " +
//     "rl_312_bulan_6, " +
//     "rl_312_bulan_7, " +
//     "rl_312_bulan_8, " +
//     "rl_312_bulan_9, " +
//     "rl_312_bulan_10, " +
//     "rl_312_bulan_11, " +
//     "rl_312_bulan_12, " +
//     "rl_313, " +
//     "rl_314_bulan_1, " +
//     "rl_314_bulan_2, " +
//     "rl_314_bulan_3, " +
//     "rl_314_bulan_4, " +
//     "rl_314_bulan_5, " +
//     "rl_314_bulan_6, " +
//     "rl_314_bulan_7, " +
//     "rl_314_bulan_8, " +
//     "rl_314_bulan_9, " +
//     "rl_314_bulan_10, " +
//     "rl_314_bulan_11, " +
//     "rl_314_bulan_12, " +
//     "rl_315, " +
//     "rl_316, " +
//     "rl_317, " +
//     "rl_318, " +
//     "rl_319, " +
//     "rl_41_bulan_1, " +
//     "rl_41_bulan_2, " +
//     "rl_41_bulan_3, " +
//     "rl_41_bulan_4, " +
//     "rl_41_bulan_5, " +
//     "rl_41_bulan_6, " +
//     "rl_41_bulan_7, " +
//     "rl_41_bulan_8, " +
//     "rl_41_bulan_9, " +
//     "rl_41_bulan_10, " +
//     "rl_41_bulan_11, " +
//     "rl_41_bulan_12, " +
//     "rl_42_bulan_1, " +
//     "rl_42_bulan_2, " +
//     "rl_42_bulan_3, " +
//     "rl_42_bulan_4, " +
//     "rl_42_bulan_5, " +
//     "rl_42_bulan_6, " +
//     "rl_42_bulan_7, " +
//     "rl_42_bulan_8, " +
//     "rl_42_bulan_9, " +
//     "rl_42_bulan_10, " +
//     "rl_42_bulan_11, " +
//     "rl_42_bulan_12, " +
//     "rl_43_bulan_1, " +
//     "rl_43_bulan_2, " +
//     "rl_43_bulan_3, " +
//     "rl_43_bulan_4, " +
//     "rl_43_bulan_5, " +
//     "rl_43_bulan_6, " +
//     "rl_43_bulan_7, " +
//     "rl_43_bulan_8, " +
//     "rl_43_bulan_9, " +
//     "rl_43_bulan_10, " +
//     "rl_43_bulan_11, " +
//     "rl_43_bulan_12, " +
//     "rl_51_bulan_1, " +
//     "rl_51_bulan_2, " +
//     "rl_51_bulan_3, " +
//     "rl_51_bulan_4, " +
//     "rl_51_bulan_5, " +
//     "rl_51_bulan_6, " +
//     "rl_51_bulan_7, " +
//     "rl_51_bulan_8, " +
//     "rl_51_bulan_9, " +
//     "rl_51_bulan_10, " +
//     "rl_51_bulan_11, " +
//     "rl_51_bulan_12, " +
//     "rl_52_bulan_1, " +
//     "rl_52_bulan_2, " +
//     "rl_52_bulan_3, " +
//     "rl_52_bulan_4, " +
//     "rl_52_bulan_5, " +
//     "rl_52_bulan_6, " +
//     "rl_52_bulan_7, " +
//     "rl_52_bulan_8, " +
//     "rl_52_bulan_9, " +
//     "rl_52_bulan_10, " +
//     "rl_52_bulan_11, " +
//     "rl_52_bulan_12, " +
//     "rl_53_bulan_1, " +
//     "rl_53_bulan_2, " +
//     "rl_53_bulan_3, " +
//     "rl_53_bulan_4, " +
//     "rl_53_bulan_5, " +
//     "rl_53_bulan_6, " +
//     "rl_53_bulan_7, " +
//     "rl_53_bulan_8, " +
//     "rl_53_bulan_9, " +
//     "rl_53_bulan_10, " +
//     "rl_53_bulan_11, " +
//     "rl_53_bulan_12, " +
//     "CASE " +
//     "WHEN ROUND (( " +
//     "rl_31_bulan_1 + rl_31_bulan_2 + rl_31_bulan_3 + rl_31_bulan_4 + rl_31_bulan_5 + rl_31_bulan_6 + rl_31_bulan_7 + rl_31_bulan_8 + rl_31_bulan_9 + rl_31_bulan_10 + rl_31_bulan_11 + rl_31_bulan_12 + " +
//     "rl_32_bulan_1 + rl_32_bulan_2 + rl_32_bulan_3 + rl_32_bulan_4 + rl_32_bulan_5 + rl_32_bulan_6 + rl_32_bulan_7 + rl_32_bulan_8 + rl_32_bulan_9 + rl_32_bulan_10 + rl_32_bulan_11 + rl_32_bulan_12 + " +
//     "rl_33_bulan_1 + rl_33_bulan_2 + rl_33_bulan_3 + rl_33_bulan_4 + rl_33_bulan_5 + rl_33_bulan_6 + rl_33_bulan_7 + rl_33_bulan_8 + rl_33_bulan_9 + rl_33_bulan_10 + rl_33_bulan_11 + rl_33_bulan_12 + " +
//     "rl_34_bulan_1 + rl_34_bulan_2 + rl_34_bulan_3 + rl_34_bulan_4 + rl_34_bulan_5 + rl_34_bulan_6 + rl_34_bulan_7 + rl_34_bulan_8 + rl_34_bulan_9 + rl_34_bulan_10 + rl_34_bulan_11 + rl_34_bulan_12 + " +
//     "rl_35_bulan_1 + rl_35_bulan_2 + rl_35_bulan_3 + rl_35_bulan_4 + rl_35_bulan_5 + rl_35_bulan_6 + rl_35_bulan_7 + rl_35_bulan_8 + rl_35_bulan_9 + rl_35_bulan_10 + rl_35_bulan_11 + rl_35_bulan_12 + " +
//     "rl_36_bulan_1 + rl_36_bulan_2 + rl_36_bulan_3 + rl_36_bulan_4 + rl_36_bulan_5 + rl_36_bulan_6 + rl_36_bulan_7 + rl_36_bulan_8 + rl_36_bulan_9 + rl_36_bulan_10 + rl_36_bulan_11 + rl_36_bulan_12 + " +
//     "rl_37_bulan_1 + rl_37_bulan_2 + rl_37_bulan_3 + rl_37_bulan_4 + rl_37_bulan_5 + rl_37_bulan_6 + rl_37_bulan_7 + rl_37_bulan_8 + rl_37_bulan_9 + rl_37_bulan_10 + rl_37_bulan_11 + rl_37_bulan_12 + " +
//     "rl_38_bulan_1 + rl_38_bulan_2 + rl_38_bulan_3 + rl_38_bulan_4 + rl_38_bulan_5 + rl_38_bulan_6 + rl_38_bulan_7 + rl_38_bulan_8 + rl_38_bulan_9 + rl_38_bulan_10 + rl_38_bulan_11 + rl_38_bulan_12 + " +
//     "rl_39_bulan_1 + rl_39_bulan_2 + rl_39_bulan_3 + rl_39_bulan_4 + rl_39_bulan_5 + rl_39_bulan_6 + rl_39_bulan_7 + rl_39_bulan_8 + rl_39_bulan_9 + rl_39_bulan_10 + rl_39_bulan_11 + rl_39_bulan_12 + " +
//     "rl_310_bulan_1 + rl_310_bulan_2 + rl_310_bulan_3 + rl_310_bulan_4 + rl_310_bulan_5 + rl_310_bulan_6 + rl_310_bulan_7 + rl_310_bulan_8 + rl_310_bulan_9 + rl_310_bulan_10 + rl_310_bulan_11 + rl_310_bulan_12 + " +
//     "rl_311 + " +
//     "rl_312_bulan_1 + rl_312_bulan_2 + rl_312_bulan_3 + rl_312_bulan_4 + rl_312_bulan_5 + rl_312_bulan_6 + rl_312_bulan_7 + rl_312_bulan_8 + rl_312_bulan_9 + rl_312_bulan_10 + rl_312_bulan_11 + rl_312_bulan_12 + " +
//     "rl_313 + " +
//     "rl_314_bulan_1 + rl_314_bulan_2 + rl_314_bulan_3 + rl_314_bulan_4 + rl_314_bulan_5 + rl_314_bulan_6 + rl_314_bulan_7 + rl_314_bulan_8 + rl_314_bulan_9 + rl_314_bulan_10 + rl_314_bulan_11 + rl_314_bulan_12 + " +
//     "rl_315 + rl_316 + rl_317 + rl_318 + rl_319 + " +
//     "rl_41_bulan_1 + rl_41_bulan_2 + rl_41_bulan_3 + rl_41_bulan_4 + rl_41_bulan_5 + rl_41_bulan_6 + rl_41_bulan_7 + rl_41_bulan_8 + rl_41_bulan_9 + rl_41_bulan_10 + rl_41_bulan_11 + rl_41_bulan_12 + " +
//     "rl_42_bulan_1 + rl_42_bulan_2 + rl_42_bulan_3 + rl_42_bulan_4 + rl_42_bulan_5 + rl_42_bulan_6 + rl_42_bulan_7 + rl_42_bulan_8 + rl_42_bulan_9 + rl_42_bulan_10 + rl_42_bulan_11 + rl_42_bulan_12 + " +
//     "rl_43_bulan_1 + rl_43_bulan_2 + rl_43_bulan_3 + rl_43_bulan_4 + rl_43_bulan_5 + rl_43_bulan_6 + rl_43_bulan_7 + rl_43_bulan_8 + rl_43_bulan_9 + rl_43_bulan_10 + rl_43_bulan_11 + rl_43_bulan_12 + " +
//     "rl_51_bulan_1 + rl_51_bulan_2 + rl_51_bulan_3 + rl_51_bulan_4 + rl_51_bulan_5 + rl_51_bulan_6 + rl_51_bulan_7 + rl_51_bulan_8 + rl_51_bulan_9 + rl_51_bulan_10 + rl_51_bulan_11 + rl_51_bulan_12 + " +
//     "rl_52_bulan_1 + rl_52_bulan_2 + rl_52_bulan_3 + rl_52_bulan_4 + rl_52_bulan_5 + rl_52_bulan_6 + rl_52_bulan_7 + rl_52_bulan_8 + rl_52_bulan_9 + rl_52_bulan_10 + rl_52_bulan_11 + rl_52_bulan_12 + " +
//     "rl_53_bulan_1 + rl_53_bulan_2 + rl_53_bulan_3 + rl_53_bulan_4 + rl_53_bulan_5 + rl_53_bulan_6 + rl_53_bulan_7 + rl_53_bulan_8 + rl_53_bulan_9 + rl_53_bulan_10 + rl_53_bulan_11 + rl_53_bulan_12 " +
//     ") * 100 / 223, 2) = 100 " +
//     "THEN 100 " +
//     "ELSE ROUND (( " +
//     "rl_31_bulan_1 + rl_31_bulan_2 + rl_31_bulan_3 + rl_31_bulan_4 + rl_31_bulan_5 + rl_31_bulan_6 + rl_31_bulan_7 + rl_31_bulan_8 + rl_31_bulan_9 + rl_31_bulan_10 + rl_31_bulan_11 + rl_31_bulan_12 + " +
//     "rl_32_bulan_1 + rl_32_bulan_2 + rl_32_bulan_3 + rl_32_bulan_4 + rl_32_bulan_5 + rl_32_bulan_6 + rl_32_bulan_7 + rl_32_bulan_8 + rl_32_bulan_9 + rl_32_bulan_10 + rl_32_bulan_11 + rl_32_bulan_12 + " +
//     "rl_33_bulan_1 + rl_33_bulan_2 + rl_33_bulan_3 + rl_33_bulan_4 + rl_33_bulan_5 + rl_33_bulan_6 + rl_33_bulan_7 + rl_33_bulan_8 + rl_33_bulan_9 + rl_33_bulan_10 + rl_33_bulan_11 + rl_33_bulan_12 + " +
//     "rl_34_bulan_1 + rl_34_bulan_2 + rl_34_bulan_3 + rl_34_bulan_4 + rl_34_bulan_5 + rl_34_bulan_6 + rl_34_bulan_7 + rl_34_bulan_8 + rl_34_bulan_9 + rl_34_bulan_10 + rl_34_bulan_11 + rl_34_bulan_12 + " +
//     "rl_35_bulan_1 + rl_35_bulan_2 + rl_35_bulan_3 + rl_35_bulan_4 + rl_35_bulan_5 + rl_35_bulan_6 + rl_35_bulan_7 + rl_35_bulan_8 + rl_35_bulan_9 + rl_35_bulan_10 + rl_35_bulan_11 + rl_35_bulan_12 + " +
//     "rl_36_bulan_1 + rl_36_bulan_2 + rl_36_bulan_3 + rl_36_bulan_4 + rl_36_bulan_5 + rl_36_bulan_6 + rl_36_bulan_7 + rl_36_bulan_8 + rl_36_bulan_9 + rl_36_bulan_10 + rl_36_bulan_11 + rl_36_bulan_12 + " +
//     "rl_37_bulan_1 + rl_37_bulan_2 + rl_37_bulan_3 + rl_37_bulan_4 + rl_37_bulan_5 + rl_37_bulan_6 + rl_37_bulan_7 + rl_37_bulan_8 + rl_37_bulan_9 + rl_37_bulan_10 + rl_37_bulan_11 + rl_37_bulan_12 + " +
//     "rl_38_bulan_1 + rl_38_bulan_2 + rl_38_bulan_3 + rl_38_bulan_4 + rl_38_bulan_5 + rl_38_bulan_6 + rl_38_bulan_7 + rl_38_bulan_8 + rl_38_bulan_9 + rl_38_bulan_10 + rl_38_bulan_11 + rl_38_bulan_12 + " +
//     "rl_39_bulan_1 + rl_39_bulan_2 + rl_39_bulan_3 + rl_39_bulan_4 + rl_39_bulan_5 + rl_39_bulan_6 + rl_39_bulan_7 + rl_39_bulan_8 + rl_39_bulan_9 + rl_39_bulan_10 + rl_39_bulan_11 + rl_39_bulan_12 + " +
//     "rl_310_bulan_1 + rl_310_bulan_2 + rl_310_bulan_3 + rl_310_bulan_4 + rl_310_bulan_5 + rl_310_bulan_6 + rl_310_bulan_7 + rl_310_bulan_8 + rl_310_bulan_9 + rl_310_bulan_10 + rl_310_bulan_11 + rl_310_bulan_12 + " +
//     "rl_311 + " +
//     "rl_312_bulan_1 + rl_312_bulan_2 + rl_312_bulan_3 + rl_312_bulan_4 + rl_312_bulan_5 + rl_312_bulan_6 + rl_312_bulan_7 + rl_312_bulan_8 + rl_312_bulan_9 + rl_312_bulan_10 + rl_312_bulan_11 + rl_312_bulan_12 + " +
//     "rl_313 + " +
//     "rl_314_bulan_1 + rl_314_bulan_2 + rl_314_bulan_3 + rl_314_bulan_4 + rl_314_bulan_5 + rl_314_bulan_6 + rl_314_bulan_7 + rl_314_bulan_8 + rl_314_bulan_9 + rl_314_bulan_10 + rl_314_bulan_11 + rl_314_bulan_12 + " +
//     "rl_315 + rl_316 + rl_317 + rl_318 + rl_319 + " +
//     "rl_41_bulan_1 + rl_41_bulan_2 + rl_41_bulan_3 + rl_41_bulan_4 + rl_41_bulan_5 + rl_41_bulan_6 + rl_41_bulan_7 + rl_41_bulan_8 + rl_41_bulan_9 + rl_41_bulan_10 + rl_41_bulan_11 + rl_41_bulan_12 + " +
//     "rl_42_bulan_1 + rl_42_bulan_2 + rl_42_bulan_3 + rl_42_bulan_4 + rl_42_bulan_5 + rl_42_bulan_6 + rl_42_bulan_7 + rl_42_bulan_8 + rl_42_bulan_9 + rl_42_bulan_10 + rl_42_bulan_11 + rl_42_bulan_12 + " +
//     "rl_43_bulan_1 + rl_43_bulan_2 + rl_43_bulan_3 + rl_43_bulan_4 + rl_43_bulan_5 + rl_43_bulan_6 + rl_43_bulan_7 + rl_43_bulan_8 + rl_43_bulan_9 + rl_43_bulan_10 + rl_43_bulan_11 + rl_43_bulan_12 + " +
//     "rl_51_bulan_1 + rl_51_bulan_2 + rl_51_bulan_3 + rl_51_bulan_4 + rl_51_bulan_5 + rl_51_bulan_6 + rl_51_bulan_7 + rl_51_bulan_8 + rl_51_bulan_9 + rl_51_bulan_10 + rl_51_bulan_11 + rl_51_bulan_12 + " +
//     "rl_52_bulan_1 + rl_52_bulan_2 + rl_52_bulan_3 + rl_52_bulan_4 + rl_52_bulan_5 + rl_52_bulan_6 + rl_52_bulan_7 + rl_52_bulan_8 + rl_52_bulan_9 + rl_52_bulan_10 + rl_52_bulan_11 + rl_52_bulan_12 + " +
//     "rl_53_bulan_1 + rl_53_bulan_2 + rl_53_bulan_3 + rl_53_bulan_4 + rl_53_bulan_5 + rl_53_bulan_6 + rl_53_bulan_7 + rl_53_bulan_8 + rl_53_bulan_9 + rl_53_bulan_10 + rl_53_bulan_11 + rl_53_bulan_12 " +
//     ") * 100 / 223, 2) " +
//     "END AS persentase_pengisian ";

//   const sqlFrom = "FROM " + "absensi ";

//   const sqlWhere = "WHERE ";

//   const sqlOrder = "ORDER BY nama_rs";

//   const filter = [];
//   const sqlFilterValue = [];

//   const rsId = req.query.rsId || null;
//   const tahun = req.query.tahun || null;

//   if (rsId != null) {
//     filter.push("absensi.rs_id IN (?) ");
//     sqlFilterValue.push(rsId.split(";"));
//   }

//   if (tahun != null) {
//     filter.push("absensi.tahun = ?");
//     sqlFilterValue.push(tahun);
//   }

//   let sqlFilter = "";
//   filter.forEach((value, index) => {
//     if (index == 0) {
//       sqlFilter = sqlWhere.concat(value);
//     } else if (index > 0) {
//       sqlFilter = sqlFilter.concat(" AND ").concat(value);
//     }
//   });

//   const sql = sqlSelect.concat(sqlFrom).concat(sqlFilter).concat(sqlOrder);
//   databaseSIRS
//     .query(sql, {
//       type: QueryTypes.SELECT,
//       replacements: sqlFilterValue,
//     })
//     .then((res) => {
//       callback(null, res);
//     })
//     .catch((error) => {
//       callback(error, null);
//     });
// };

export const get = (req, callback) => {
  const columns = [];
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((i) => {
    for (let m = 1; m <= 12; m++) columns.push(`rl_3${i}_bulan_${m}`);
  });
  columns.push("rl_311");
  for (let m = 1; m <= 12; m++) columns.push(`rl_312_bulan_${m}`);
  columns.push("rl_313");
  for (let m = 1; m <= 12; m++) columns.push(`rl_314_bulan_${m}`);
  [15, 16, 17, 18, 19].forEach((i) => columns.push(`rl_3${i}`));
  [1, 2, 3].forEach((i) => {
    for (let m = 1; m <= 12; m++) columns.push(`rl_4${i}_bulan_${m}`);
  });
  [1, 2, 3].forEach((i) => {
    for (let m = 1; m <= 12; m++) columns.push(`rl_5${i}_bulan_${m}`);
  });

  const sumColumns = columns.map((c) => `absensi.${c}`).join(" + ");
  const sumValidationDone = columns
    .map((c) => `CASE WHEN absensi_validasi.${c} = 3 THEN 1 ELSE 0 END`)
    .join(" + ");
  const absensiSelect = columns.map((c) => `absensi.${c}`).join(", ");
  const validationSelect = columns
    .map((c) => `absensi_validasi.${c} AS ${c}_validasi`)
    .join(", ");
  const totalField = columns.length;

  // const sqlSelect =
  //   "SELECT " +
  //   "absensi.rs_id, " +
  //   "CASE " +
  //   "WHEN ROUND (( " +
  //   sumColumns +
  //   ") * 100 / 223, 2) = 0 " +
  //   "THEN 100 " +
  //   "WHEN ROUND (( " +
  //   sumColumns +
  //   ") * 100 / 223, 2) = 0 " +
  //   "THEN 100 " +
  //   "ELSE ROUND (( " +
  //   sumColumns +
  //   ") * 100 / 223, 2) " +
  //   "END AS persentase_pengisian, " +
  //   absensiSelect +
  //   ", " +
  //   validationSelect +
  //   " ";

  // const sqlSelect =
  //   "SELECT " +
  //   "absensi.rs_id, " +
  //   "ROUND (( " +
  //   sumColumns +
  //   ") * 100 / 223, 2) AS persentase_pengisian, " +
  //   absensiSelect +
  //   ", " +
  //   validationSelect +
  //   " ";

  const sqlSelect =
    "SELECT " +
    "absensi.rs_id, " +
    "ROUND (( " +
    sumColumns +
    ") * 100 /" +
    totalField +
    ", 2) AS persentasePengisian, " +
    "CASE " +
    "WHEN absensi_validasi.rs_id IS NULL THEN 0 " +
    "ELSE ROUND((" +
    sumValidationDone +
    ") * 100 / " +
    totalField +
    ", 2) " +
    "END AS persentaseValidasi, " +
    absensiSelect +
    ", " +
    validationSelect +
    " ";

  const sqlFrom =
    "FROM " +
    "absensi " +
    "LEFT JOIN absensi_validasi ON absensi.rs_id = absensi_validasi.rs_id AND absensi.tahun = absensi_validasi.tahun ";

  const sqlWhere = "WHERE ";

  const sqlOrder = "ORDER BY nama_rs";

  const filter = [];
  const sqlFilterValue = [];

  const rsId = req.query.rsId || null;
  const tahun = req.query.tahun || null;

  if (rsId != null) {
    filter.push("absensi.rs_id IN (?) ");
    sqlFilterValue.push(rsId.split(";"));
  }

  if (tahun != null) {
    filter.push("absensi.tahun = ?");
    sqlFilterValue.push(tahun);
  }

  let sqlFilter = "";
  filter.forEach((value, index) => {
    if (index == 0) {
      sqlFilter = sqlWhere.concat(value);
    } else if (index > 0) {
      sqlFilter = sqlFilter.concat(" AND ").concat(value);
    }
  });

  const sql = sqlSelect.concat(sqlFrom).concat(sqlFilter).concat(sqlOrder);
  databaseSIRS
    .query(sql, {
      type: QueryTypes.SELECT,
      replacements: sqlFilterValue,
    })
    .then((res) => {
      callback(null, res);
    })
    .catch((error) => {
      callback(error, null);
    });
};

export const insertIfNotExist = async ({ rs_id, nama_rs }, t) => {
  const exist = await databaseSIRS.query(
    "SELECT rs_id FROM absensi WHERE rs_id = :rs_id",
    {
      type: QueryTypes.SELECT,
      replacements: { rs_id },
      transaction: t,
    },
  );

  if (exist.length === 0) {
    await databaseSIRS.query(
      "INSERT INTO absensi (rs_id, nama_rs) VALUES (:rs_id, :nama_rs)",
      {
        type: QueryTypes.INSERT,
        replacements: { rs_id, nama_rs },
        transaction: t,
      },
    );
  }
};
