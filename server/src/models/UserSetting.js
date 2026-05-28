import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    userId:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    focusDuration:        { type: Number, default: 25, min: 1, max: 120 },
    shortBreakDuration:   { type: Number, default: 5,  min: 1, max: 60 },
    longBreakDuration:    { type: Number, default: 15, min: 1, max: 60 },
    theme:                { type: String, enum: ['light', 'dark'], default: 'light' },
    notificationEnabled:  { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

export const UserSetting = mongoose.model('UserSetting', settingSchema);
