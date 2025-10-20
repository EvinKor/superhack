import mongoose, { Document, Schema } from 'mongoose';

export interface ISpendBreakdown {
  softwareLicenses: number;
  hardwareMaintenance: number;
  cloudServices: number;
  laborCosts: number;
}

export interface IFinancialInsight extends Document {
  _id: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM format
  revenue: number;
  expenses: number;
  profitMargin: number;
  spendBreakdown: ISpendBreakdown;
  aiRecommendations: string[];
  createdAt: Date;
}

const SpendBreakdownSchema = new Schema<ISpendBreakdown>(
  {
    softwareLicenses: {
      type: Number,
      required: true,
      min: [0, 'Software licenses cost cannot be negative']
    },
    hardwareMaintenance: {
      type: Number,
      required: true,
      min: [0, 'Hardware maintenance cost cannot be negative']
    },
    cloudServices: {
      type: Number,
      required: true,
      min: [0, 'Cloud services cost cannot be negative']
    },
    laborCosts: {
      type: Number,
      required: true,
      min: [0, 'Labor costs cannot be negative']
    }
  },
  { _id: false }
);

const FinancialInsightSchema = new Schema<IFinancialInsight>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Client ID is required'],
      ref: 'Client'
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
      trim: true
    },
    revenue: {
      type: Number,
      required: [true, 'Revenue is required'],
      min: [0, 'Revenue cannot be negative']
    },
    expenses: {
      type: Number,
      required: [true, 'Expenses are required'],
      min: [0, 'Expenses cannot be negative']
    },
    profitMargin: {
      type: Number,
      required: [true, 'Profit margin is required'],
      min: [-100, 'Profit margin cannot be less than -100%'],
      max: [100, 'Profit margin cannot exceed 100%']
    },
    spendBreakdown: {
      type: SpendBreakdownSchema,
      required: [true, 'Spend breakdown is required']
    },
    aiRecommendations: [{
      type: String,
      trim: true,
      maxlength: [500, 'AI recommendation cannot exceed 500 characters']
    }],
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
FinancialInsightSchema.index({ clientId: 1 });
FinancialInsightSchema.index({ month: 1 });
FinancialInsightSchema.index({ clientId: 1, month: 1 }, { unique: true });

// Virtual for calculated profit amount
FinancialInsightSchema.virtual('profitAmount').get(function() {
  return this.revenue - this.expenses;
});

// Ensure virtual fields are serialized
FinancialInsightSchema.set('toJSON', {
  virtuals: true
});

export const FinancialInsight = mongoose.model<IFinancialInsight>('FinancialInsight', FinancialInsightSchema);


