const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a package name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  category: {
    type: String,
    enum: ['Standard Laundry', 'Dry Cleaning', 'Express Service', 'Special Items', 'Subscription'],
    required: [true, 'Please specify a category']
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  turnaroundTime: {
    type: String,
    required: [true, 'Please specify turnaround time']
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Package', PackageSchema);