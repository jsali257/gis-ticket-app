import mongoose from 'mongoose';

// Define and export the User schema
export const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'gis_staff', 'gis_verifier', 'front_desk'],
    default: 'user',
  },
  department: {
    type: String,
    enum: ['Front Desk', 'GIS', 'Admin', 'Other'],
    default: 'Other',
  },
  isAvailableForAssignment: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);