import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    type:    {
      type: String,
      enum: ['task_overdue', 'task_completed', 'pomodoro_done', 'deadline_soon', 'estimated_reached'],
      required: true,
    },
    taskId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true, versionKey: false } },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, taskId: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
