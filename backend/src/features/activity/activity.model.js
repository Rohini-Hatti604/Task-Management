import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['task', 'project'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Object },
  },
  { timestamps: true }
);

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
