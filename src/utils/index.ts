import jwt from 'jsonwebtoken'
export const verifyRefreshToken = (token: string) => {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (error) {
      return null;
    }
  };
  export const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '1d' });
  };
  
  // Function to generate Refresh Token
  export const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId },process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
  };