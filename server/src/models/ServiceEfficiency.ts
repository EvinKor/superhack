import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceEfficiency extends Document {
  _id: mongoose.Types.ObjectId;
  technicianId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  tasksCompleted: number;
  avgResponseTime: number; // minutes
  avgResolutionTime: number; // minutes
  aiSuggestions: string[];
  week: string; // ISO week e.g., 2025-W41
  createdAt: Date;
}

const ServiceEfficiencySchema = new Schema<IServiceEfficiency>(
  {
    technicianId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Technician ID is required'],
      ref: 'User'
    },
    clientId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Client ID is required'],
      ref: 'Client'
    },
    tasksCompleted: {
      type: Number,
      required: [true, 'Tasks completed is required'],
      min: [0, 'Tasks completed cannot be negative']
    },
    avgResponseTime: {
      type: Number,
      required: [true, 'Average response time is required'],
      min: [0, 'Average response time cannot be negative']
    },
    avgResolutionTime: {
      type: Number,
      required: [true, 'Average resolution time is required'],
      min: [0, 'Average resolution time cannot be negative']
    },
    aiSuggestions: [{
      type: String,
      trim: true,
      maxlength: [500, 'AI suggestion cannot exceed 500 characters']
    }],
    week: {
      type: String,
      required: [true, 'Week is required'],
      match: [/^\d{4}-W\d{2}$/, 'Week must be in YYYY-WXX format'],
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false, // We're using createdAt explicitly
    versionKey: false
  }
);

// Indexes
ServiceEfficiencySchema.index({ technicianId: 1 });
ServiceEfficiencySchema.index({ week: 1 });
ServiceEfficiencySchema.index({ clientId: 1 });
ServiceEfficiencySchema.index({ technicianId: 1, week: 1 });
ServiceEfficiencySchema.index({ clientId: 1, week: 1 });

// Virtual for efficiency score (lower is better)
ServiceEfficiencySchema.virtual('efficiencyScore').get(function() {
  const responseScore = Math.max(0, 100 - (this.avgResponseTime / 60)); // Convert to hours, max 100
  const resolutionScore = Math.max(0, 100 - (this.avgResolutionTime / 60)); // Convert to hours, max 100
  const taskScore = Math.min(100, (this.tasksCompleted / 10) * 100); // 10 tasks = 100%
  
  return (responseScore + resolutionScore + taskScore) / 3;
});

// Virtual for total time spent
ServiceEfficiencySchema.virtual('totalTimeSpent').get(function() {
  return this.avgResponseTime + this.avgResolutionTime;
});

// Ensure virtual fields are serialized
ServiceEfficiencySchema.set('toJSON', {
  virtuals: true
});

export const ServiceEfficiency = mongoose.model<IServiceEfficiency>('ServiceEfficiency', ServiceEfficiencySchema);


