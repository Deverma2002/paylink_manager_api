const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../routes/jwt');
const Results = require('../models/Results');
const Team = require('../models/Team');
const Order = require('../models/Order');
const User = require('../models/user');

const router = express.Router();

router.get('/results', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    console.log('User role:', req.user.role);
    console.log('Date filter:', date);

    let filter = {};

    if (req.user.role === 'Admin') {
      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        filter.completionDate = { $gte: startOfDay, $lte: endOfDay };
      }
    } else if (req.user.role === 'TeamLeader') {
      const teamIds = await Team.find({ teamLeader: req.user.id }).select('_id');
      filter.teamId = { $in: teamIds.map((team) => team._id) };

      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        filter.completionDate = { $gte: startOfDay, $lte: endOfDay };
      }
    } else {
      filter.memberId = req.user.id;

      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        filter.completionDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // Fetch results data
    let results = await Results.find(filter)
    .populate({
      path: 'orderId', 
      select: 'orderId status paymentStatus link', // Make sure to include relevant fields
    })
    .populate({ path: 'teamId', select: 'teamName' })
    .populate({ path: 'memberName', select: 'name' });
  
    console.log('Raw results fetched from database:', results);

   
    const transformedResults = await Promise.all(
      results.map(async (result) => {
        const team = result.teamId
          ? await Team.findById(result.teamId).select('teamName')
          : null;

        const order = result.orderId
          ? await Order.findById(result.orderId).select('orderId paymentStatus')
          : null;

        // Debug logs for memberName and other fields
        console.log(`Processing result ID: ${result._id}`);
        console.log('Member ID:', result.memberId);
        console.log('Member Name:', result.memberName);

        return {
          resultId: result._id,
          orderId: order?.orderId || null,
          paymentStatus: order?.paymentStatus || null, // Default to null if not present
          teamId: result.teamId || null,
          teamName: team?.teamName || null, // Default to null if not present
          memberName: result.memberName || null,
          profitBehindOrder: result.profitBehindOrder != null ? result.profitBehindOrder : null, // Explicitly check for null
          membersProfit: result.membersProfit != null ? result.membersProfit : null, // Explicitly check for null
          completionDate: result.completionDate || null,
        };
      })
    );

    console.log('Transformed results to be sent:', transformedResults);

    res.status(200).json(transformedResults);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
