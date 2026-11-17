import { canAccessSatset } from "../services/satsetAccess.service.js";

export const requireSatsetAccess = async (req, res, next) => {
  try {
    if (await canAccessSatset(req.user)) return next();
    return res.status(403).send({
      status: false,
      message: "Fitur SatuSehat belum tersedia untuk akun Anda",
    });
  } catch (e) {
    return res
      .status(500)
      .send({ status: false, message: "Gagal cek akses SatuSehat" });
  }
};
