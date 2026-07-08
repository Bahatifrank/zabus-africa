import CryptoJS from "crypto-js";

const SECRET = process.env.NEXT_PUBLIC_CHAT_SECRET!;

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET).toString();
}

export function decrypt(text: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(text, SECRET);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption fails or returns empty, return original (for old unencrypted messages)
    return result || text;
  } catch {
    return text;
  }
}