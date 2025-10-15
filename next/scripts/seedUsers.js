import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import User from "../src/lib/models/User.js"
import {connectDB} from "../src/lib/db.js"


const users = [
  // { username: "player1", password: "pass123" },
  // { username: "player2", password: "pass456" },
  // { username: "player3", password: "pass789" },
  { username: "player11", password: "pass123" },
  { username: "player22", password: "pass456" },
  { username: "player33", password: "pass789" },
  { username: "player111", password: "pass123" },
  { username: "player222", password: "pass456" },
  { username: "player333", password: "pass789" },
];

async function seed() {
  await connectDB();
  console.log("Connected ✅");

  const hashedUsers = await Promise.all(
    users.map(async (u) => ({
      username: u.username,
      passwordHash: await bcrypt.hash(u.password, 10),
    }))
  );

  await User.insertMany(hashedUsers);
  console.log("✅ Seeded users successfully");
  process.exit(0);
}

seed();


