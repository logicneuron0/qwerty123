import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

//create jwt
export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
//verfiy jwt
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    console.error("Invalid token:", err.message);
    return null;
  }
}

//set cookies
export function setTokenCookie(res, token) {
  res.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7d
  });
}
//clear cookies on logout
export function clearTokenCookie(res) {
  res.cookies.set({
    name: "token",
    value: "",
    path: "/",
    maxAge: 0,
  });
}

// Read and verify session from cookies
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;
  
  const session= verifyToken(token);
  if(!session) return null;

  return session;
}