import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  _id: mongoose.Types.ObjectId;
  clientName: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createdBy: string; // creator email
  createdAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters']
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
      maxlength: [50, 'Industry cannot exceed 50 characters']
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be active or inactive'
      },
      default: 'active'
    },
    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
      lowercase: true,
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
ClientSchema.index({ clientName: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ createdBy: 1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);


