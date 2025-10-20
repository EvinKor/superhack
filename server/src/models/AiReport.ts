import mongoose, { Document, Schema } from 'mongoose';

export interface IAiReport extends Document {
  _id: mongoose.Types.ObjectId;
  reportType: 'Financial Forecast' | 'Service Optimization';
  generatedForId: mongoose.Types.ObjectId;
  generatedForType: 'client' | 'user';
  summary: string;
  recommendations: string[];
  confidenceScore: number; // 0..1
  createdAt: Date;
}

const AiReportSchema = new Schema<IAiReport>(
  {
    reportType: {
      type: String,
      required: [true, 'Report type is required'],
      enum: {
        values: ['Financial Forecast', 'Service Optimization'],
        message: 'Report type must be Financial Forecast or Service Optimization'
      }
    },
    generatedForId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Generated for ID is required']
    },
    generatedForType: {
      type: String,
      required: [true, 'Generated for type is required'],
      enum: {
        values: ['client', 'user'],
        message: 'Generated for type must be client or user'
      }
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      maxlength: [2000, 'Summary cannot exceed 2000 characters']
    },
    recommendations: [{
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Recommendation cannot exceed 500 characters']
    }],
    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score cannot be less than 0'],
      max: [1, 'Confidence score cannot exceed 1']
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
AiReportSchema.index({ reportType: 1 });
AiReportSchema.index({ createdAt: -1 });
AiReportSchema.index({ generatedForId: 1, generatedForType: 1 });
AiReportSchema.index({ reportType: 1, createdAt: -1 });

// Virtual for confidence level
AiReportSchema.virtual('confidenceLevel').get(function() {
  if (this.confidenceScore >= 0.8) return 'High';
  if (this.confidenceScore >= 0.6) return 'Medium';
  if (this.confidenceScore >= 0.4) return 'Low';
  return 'Very Low';
});

// Virtual for target reference (polymorphic)
AiReportSchema.virtual('target').get(function() {
  return {
    id: this.generatedForId,
    type: this.generatedForType
  };
});

// Ensure virtual fields are serialized
AiReportSchema.set('toJSON', {
  virtuals: true
});

export const AiReport = mongoose.model<IAiReport>('AiReport', AiReportSchema);


