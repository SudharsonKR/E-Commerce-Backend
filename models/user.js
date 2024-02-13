import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true},
    email: {
      type: String,
      required: true,
      maxlength: 200,
      unique: true,
    },
    password: { type: String, required: true, minlength: 6, maxlength: 1024 },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User