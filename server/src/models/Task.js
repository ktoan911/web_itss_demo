import mongoose from 'mongoose';
import { rankOf } from '../utils/priorityRank.js';

const taskSchema = new mongoose.Schema(
  {
    userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:               { type: String, required: true, trim: true, maxlength: 200 },
    description:         { type: String, default: '', maxlength: 2000 },
    deadline:            { type: Date, required: true },
    priority:            { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    priorityRank:        { type: Number, default: 0 },
    status:              { type: String, enum: ['Todo', 'InProgress', 'Completed'], default: 'Todo' },
    estimatedPomodoros:  { type: Number, default: 1, min: 1 },
    completedPomodoros:  { type: Number, default: 0, min: 0 },
    completedAt:         { type: Date, default: null },
    tags:                { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => { delete ret.priorityRank; return ret; },
    },
  },
);

taskSchema.virtual('isOverdue').get(function () {
  return this.deadline < new Date() && this.status !== 'Completed';
});

taskSchema.pre('save', function () {
  if (this.isModified('priority')) this.priorityRank = rankOf(this.priority);
});

taskSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() || {};
  const setBlock = update.$set || update;
  if (setBlock.priority) {
    if (update.$set) update.$set.priorityRank = rankOf(setBlock.priority);
    else update.priorityRank = rankOf(setBlock.priority);
  }
});

taskSchema.index({ userId: 1, deadline: 1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, priorityRank: -1 });
taskSchema.index({ userId: 1, tags: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model('Task', taskSchema);
