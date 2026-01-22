import { decryptAESGCM } from "../services/cryptoService.js";

export const decrypt = async (req, res) => {
    try {
        const decryptedPayload = decryptAESGCM({
            iv: req.body.iv,
            ciphertext: req.body.ciphertext,
            tag: req.body.tag,
            keyBase64: process.env.AES_KEY
        });

        const data = JSON.parse(decryptedPayload);

        res.json({
            status: "success",
            data: data
        });

    } catch (err) {

        res.status(400).json({
            message: "Decrypt gagal"
        });

    }
};