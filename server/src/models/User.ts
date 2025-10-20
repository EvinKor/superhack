import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: 'Admin' | 'IT_Manager' | 'Technician';
  company: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['Admin', 'IT_Manager', 'Technician'],
        message: 'Role must be Admin, IT_Manager, or Technician'
      }
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: false, // We're using createdAt explicitly
    versionKey: false
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// Virtual for user's full display name
UserSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.role})`;
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).passwordHash;
    return ret;
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);
