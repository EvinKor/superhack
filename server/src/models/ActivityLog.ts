import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User'
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      maxlength: [100, 'Action cannot exceed 100 characters']
    },
    details: {
      type: String,
      required: [true, 'Details are required'],
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      trim: true,
      match: [
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        'Please enter a valid IPv4 address'
      ]
    }
  },
  {
    timestamps: false, // We're using timestamp explicitly
    versionKey: false
  }
);

// Indexes
ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);


