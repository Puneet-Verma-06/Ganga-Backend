const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  type: {
    type: String,
    enum: ['pageview', 'session', 'visitor'],
    required: true,
    index: true
  },
  // For pageviews
  path: String,
  // For tracking unique visitors
  visitorId: String,
  sessionId: String,
  // Session duration in milliseconds
  duration: Number,
  // Additional metadata
  referrer: String,
  userAgent: String,
  ip: String
  ,
  // Site/hostname (to separate analytics for multiple deployments)
  site: String
}, { 
  timestamps: true,
  // Optimize for time-series data
  timeseries: {
    timeField: 'date',
    granularity: 'hours'
  }
});

// Index for efficient querying
analyticsSchema.index({ date: -1, type: 1 });
analyticsSchema.index({ visitorId: 1, date: -1 });
analyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
