import jwt from "jsonwebtoken";

const generateToken = (userId, isVerified, pumpId) => {
  const token = jwt.sign(
    pumpId ? { userId, isVerified, pumpId } : { userId, isVerified },
    process.env.JWT_SECRET,
    {
      expiresIn: "15d",
    }
  );
  return token;
};

export default generateToken;
