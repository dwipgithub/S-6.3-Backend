import crypto from "crypto";

export const verifyHmac = (req, res, next) => {
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];

  if (!timestamp || !signature) {
    return res
      .status(401)
      .send({ status: false, message: "Missing signature" });
  }

  if (Math.abs(Date.now() - parseInt(timestamp)) > 5 * 60 * 1000) {
    return res
      .status(401)
      .send({ status: false, message: "Request kadaluarsa" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.HMAC_SECRET)
    .update(timestamp + JSON.stringify(req.body))
    .digest("hex");

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
      throw new Error();
  } catch {
    return res.status(401).send({ status: false, message: "Forbidden" });
  }

  next();
};
