import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resume: {
    type: String,
    required: true
  },
  skillMatch: {
    type: Number,
    required: true
  },
  experienceMatch: {
    type: Boolean,
    required: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['applied', 'interviewing', 'underConsideration', 'selected', 'rejected'],
    default: 'applied'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;