import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'At Risk'],
      default: 'Active',
    },
    targetDate: {
      type: String,
      default: 'September 30, 2026',
    },
    tasksCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
