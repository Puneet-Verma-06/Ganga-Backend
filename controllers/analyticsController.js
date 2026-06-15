const Analytics = require('../models/Analytics');

// Track a page view
exports.trackPageView = async (req, res) => {
  try {
    const { path, visitorId, sessionId, referrer, site } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    await Analytics.create({
      type: 'pageview',
      path,
      visitorId,
      sessionId,
      referrer,
      site,
      userAgent,
      ip,
      date: new Date()
    });

    console.log('Tracked pageview:', { path, site, visitorId, sessionId, referrer });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
};

// Track a session
exports.trackSession = async (req, res) => {
  try {
    const { sessionId, visitorId, duration, site } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    await Analytics.create({
      type: 'session',
      sessionId,
      visitorId,
      duration,
      site,
      userAgent,
      ip,
      date: new Date()
    });

    console.log('Tracked session:', { sessionId, visitorId, duration, site });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking session:', error);
    res.status(500).json({ error: 'Failed to track session' });
  }
};

// Get traffic statistics
exports.getTrafficStats = async (req, res) => {
  try {
    const { days = 30, site } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get total visits (page views)
    const baseMatch = { type: 'pageview', date: { $gte: startDate } };
    if (site) baseMatch.site = site;

    const totalVisits = await Analytics.countDocuments(baseMatch);

    // Get unique visitors
    const uniqueVisitorsData = await Analytics.aggregate([
      {
        $match: Object.assign({
          type: 'pageview',
          date: { $gte: startDate },
          visitorId: { $exists: true, $ne: null }
        }, site ? { site } : {})
      },
      {
        $group: {
          _id: '$visitorId'
        }
      },
      {
        $count: 'count'
      }
    ]);
    const uniqueVisitors = uniqueVisitorsData.length > 0 ? uniqueVisitorsData[0].count : 0;

    // Get total page views
    const pageViews = totalVisits;

    // Get average session duration
    const sessionData = await Analytics.aggregate([
      {
        $match: Object.assign({
          type: 'session',
          date: { $gte: startDate },
          duration: { $exists: true, $ne: null }
        }, site ? { site } : {})
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);
    
    let avgSessionDuration = '0m 0s';
    if (sessionData.length > 0 && sessionData[0].avgDuration) {
      const avgMs = sessionData[0].avgDuration;
      const minutes = Math.floor(avgMs / 60000);
      const seconds = Math.floor((avgMs % 60000) / 1000);
      avgSessionDuration = `${minutes}m ${seconds}s`;
    }

    // Get top pages
    const topPagesData = await Analytics.aggregate([
      {
        $match: Object.assign({
          type: 'pageview',
          date: { $gte: startDate },
          path: { $exists: true, $ne: null }
        }, site ? { site } : {})
      },
      {
        $group: {
          _id: '$path',
          views: { $sum: 1 }
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const topPages = topPagesData.map(item => ({
      path: item._id,
      views: item.views
    }));

    res.json({
      totalVisits,
      uniqueVisitors,
      pageViews,
      avgSessionDuration,
      topPages,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    res.status(500).json({ error: 'Failed to fetch traffic stats' });
  }
};

// Get traffic over time (for charts)
exports.getTrafficOverTime = async (req, res) => {
  try {
    const { days = 30, site } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchObj = Object.assign({ type: 'pageview', date: { $gte: startDate } }, site ? { site } : {});

    const trafficData = await Analytics.aggregate([
      { $match: matchObj },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const formattedData = trafficData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      views: item.count
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching traffic over time:', error);
    res.status(500).json({ error: 'Failed to fetch traffic over time' });
  }
};
