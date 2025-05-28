const express = require('express');
const Package = require('../models/Package');
const Blog = require('../models/Blog');
const Feedback = require('../models/Feedback');

const router = express.Router();

// Get service prices
router.get('/prices', async (req, res, next) => {
  try {
    const packages = await Package.find({ isActive: true });
    
    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (err) {
    next(err);
  }
});

// Get published blogs
router.get('/blogs', async (req, res, next) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .sort('-createdAt')
      .populate({
        path: 'author',
        select: 'name'
      });
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (err) {
    next(err);
  }
});

// Get public feedback/testimonials
router.get('/testimonials', async (req, res, next) => {
  try {
    const testimonials = await Feedback.find({ 
      isPublic: true,
      rating: { $gte: 4 } // Only show positive feedback as testimonials
    })
      .sort('-createdAt')
      .limit(10)
      .populate({
        path: 'user',
        select: 'name'
      });
    
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (err) {
    next(err);
  }
});

// Get service area information
router.get('/service-area', (req, res) => {
  // This would typically fetch from a database, but for simplicity:
  const serviceAreas = [
    { city: 'New York', zipCodes: ['10001', '10002', '10003'] },
    { city: 'Brooklyn', zipCodes: ['11201', '11211', '11215'] },
    { city: 'Queens', zipCodes: ['11101', '11106', '11109'] }
  ];
  
  res.status(200).json({
    success: true,
    data: serviceAreas
  });
});

// Get company information
router.get('/about', (req, res) => {
  const companyInfo = {
    name: 'Premium Laundry Service',
    founded: 2020,
    mission: 'To provide exceptional laundry and dry cleaning services while saving our customers time and hassle.',
    values: ['Quality', 'Convenience', 'Sustainability', 'Reliability'],
    team: [
      { name: 'John Doe', position: 'CEO' },
      { name: 'Jane Smith', position: 'Operations Manager' }
    ],
    locations: [
      { address: '123 Main St, New York, NY 10001', phone: '(555) 123-4567' }
    ]
  };
  
  res.status(200).json({
    success: true,
    data: companyInfo
  });
});

module.exports = router;