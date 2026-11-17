import { canAccessSatset } from "../services/satsetAccess.service.js";

export const getStatusSatset = async (req, res) => {
  try {
    const bolehLihat = await canAccessSatset(req.user);
    return res.status(200).json({
      status: true,
      status_satset: bolehLihat ? 1 : 0,
    });
  } catch (error) {
    console.error("Error getStatusSatset:", error);
    return res.status(500).json({
      status: false,
      message: "Gagal mengambil status satset",
    });
  }
};
