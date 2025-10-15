import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import User from "../src/lib/models/User.js"
import {connectDB} from "../src/lib/db.js"


const users = [
  { username: "huntingsquadsiya", password: "username123", faction: "heirs" },
  { username: "huntingsquadaryan", password: "username123", faction: "heirs" },
  { username: "hwakeye", password: "username123", faction: "heirs" },
  { username: "kaffine.js", password: "username123", faction: "heirs" },
  { username: "knights", password: "username123", faction: "heirs" },
  { username: "lalluprasad", password: "username123", faction: "heirs" },
  { username: "thedebuggingdead", password: "username123", faction: "heirs" },
  { username: "thedecrypters", password: "username123", faction: "heirs" },
  { username: "thelostscrolls", password: "username123", faction: "heirs" },
  { username: "thenightstalkers", password: "username123", faction: "heirs" },
  { username: "thetimekeepers", password: "username123", faction: "heirs" },
  { username: "thetwistedtwin", password: "username123", faction: "heirs" },


  { username: "lance", password: "username123", faction: "investigators" },
  { username: "mindspark", password: "username123", faction: "investigators" },
  { username: "novanas", password: "username123", faction: "investigators" },
  { username: "outliers", password: "username123", faction: "investigators" },
  { username: "phantom3", password: "username123", faction: "investigators" },
  { username: "rishit", password: "username123", faction: "investigators" },
  { username: "Therapistcats", password: "username123", faction: "investigators" },
  { username: "threemusketeers", password: "username123", faction: "investigators" },
  { username: "trailblazers", password: "username123", faction: "investigators" },
  { username: "triospice", password: "username123", faction: "investigators" },
  { username: "dynamicduo", password: "username123", faction: "investigators" },
  { username: "narcos", password: "username123", faction: "investigators" },


  { username: "echoesofbhangarh", password: "username123", faction: "treasurers" },
  { username: "ctrlfindtreasure", password: "username123", faction: "treasurers" },
  { username: "daredevils", password: "username123", faction: "treasurers" },
  { username: "strawhats", password: "username123", faction: "treasurers" },
  { username: "teamhaanikaarakdev", password: "username123", faction: "treasurers" },
  { username: "teamhaanikaarakvaibhav", password: "username123", faction: "treasurers" }, // Repeated name
  { username: "techgiants", password: "username123", faction: "treasurers" },
  { username: "techtrio", password: "username123", faction: "treasurers" },
  { username: "terrifyingcoders", password: "username123", faction: "treasurers" },
  { username: "ghostbusterssarvesh", password: "username123", faction: "treasurers" },
  { username: "ghostbustersritesh", password: "username123", faction: "treasurers" }, // Repeated name
  { username: "ghostbustersveer", password: "username123", faction: "treasurers" },

   { username: "00afterlife", password: "pass123", faction: "researchers"},
    { username: "10pointer", password: "pass123", faction: "researchers"},
    { username: "aidios", password: "pass123", faction: "researchers"},
    { username: "bablukesamose", password: "pass123", faction: "researchers"},
    { username: "badinternet", password: "pass123", faction: "researchers"},
    { username: "caseblitz", password: "pass123", faction: "researchers"},
    { username: "codebait", password: "pass123", faction: "researchers"},
    { username: "deadbyte", password: "pass123", faction: "researchers"},
    { username: "dominators", password: "pass123", faction: "researchers"},
    { username: "enthalpy", password: "pass123", faction: "researchers"},
    { username: "spectre", password: "pass123", faction: "researchers"},
    { username: "starlitnomads", password: "pass123", faction: "researchers"},
];

async function seed() {
  await connectDB();
  console.log("Connected ✅");

  const hashedUsers = await Promise.all(
    users.map(async (u) => ({
      username: u.username,
      passwordHash: await bcrypt.hash(u.password, 10),
      faction: u.faction,
    }))
  );

  await User.insertMany(hashedUsers);
  console.log("✅ Seeded users successfully");
  process.exit(0);
}

seed();


