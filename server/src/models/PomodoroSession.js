import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    mode:             { type: String, enum: ['Focus', 'ShortBreak', 'LongBreak'], required: true },
    durationMinutes:  { type: Number, required: true, min: 1 },
    startedAt:        { type: Date, required: true },
    endedAt:          { type: Date, default: null },
    isCompleted:      { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

sessionSchema.index({ userId: 1, startedAt: -1 });
sessionSchema.index({ taskId: 1, isCompleted: 1 });

export const PomodoroSession = mongoose.model('PomodoroSession', sessionSchema);
