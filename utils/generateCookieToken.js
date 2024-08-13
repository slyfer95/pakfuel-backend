import jwt from "jsonwebtoken";

const generateCookieToken = (userId, isVerified, res) => {
  const token = jwt.sign({ userId, isVerified }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: process.env.NODE_ENV !== "development",
  });
};

export default generateCookieToken;
