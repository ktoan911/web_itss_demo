import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName:     { type: String, required: true, trim: true, maxlength: 100 },
    email:        { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => { delete ret.passwordHash; return ret; },
    },
  },
);

export const User = mongoose.model('User', userSchema);
