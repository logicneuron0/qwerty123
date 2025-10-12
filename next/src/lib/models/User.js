// /lib/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String,
  score: { type: Number, default: 0 },
  scoreUpdatedAt: { type: Date, default: Date.now },
  faction: { type: String, default: null }, // "A", "B", etc.
  stage: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
