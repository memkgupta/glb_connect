import jwt from 'jsonwebtoken'
import {v4 as uuidv4} from "uuid"
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
    return jwt.sign({ userId },process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '30d' });
  };
  export function generateSixDigitCodeFromUUID() {
  const uuid = uuidv4(); // e.g., '1b4e28ba-2fa1-11d2-883f-0016d3cca427'
  const hex = uuid.replace(/-/g, ''); // remove dashes

  // Take first 8 chars from hex, convert to decimal, and mod to get 6 digits
  const int = parseInt(hex.substring(0, 8), 16); // get a big number from UUID
  const code = (int % 900000) + 100000; // force it into 100000-999999 range

  return code.toString();
}