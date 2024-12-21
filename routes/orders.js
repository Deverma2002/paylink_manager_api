// routes/orders.js
const express = require('express');
const Order = require('../models/Order');
const { authenticateToken } = require('../routes/jwt'); // Assuming this is for authentication
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Results = require('../models/Results');
const Team = require('../models/Team');
// Route to create a new order
router.post('/orders', authenticateToken, async (req, res) => {
  try {
    console.log('Received Data:', req.body); // Log the data sent by the frontend

    const orders = Array.isArray(req.body) ? req.body : [req.body];

    // Check for size limit
    if (orders.length > 5000) {
      return res.status(413).json({ message: 'Payload too large. Maximum 5000 records allowed.' });
    }

    // Ensure all orders include the "state" field with default value "new"
    const ordersWithState = orders.map(order => ({
      ...order,
      state: order.state || 'new', // Add "state" only if it's not already provided
    }));

    // Save orders
    const savedOrders = await Order.insertMany(ordersWithState);
    res.status(201).json({ message: 'Orders created successfully', orders: savedOrders });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Order ID must be unique' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { leadIds } = req.query; // Accept leadIds (lead ObjectIds)

    console.log(req.query); // Log incoming query for debugging

    let query = {}; // Default to fetch all orders

    // If leadIds (lead ObjectIds) are provided, filter orders
    if (leadIds) {
      const leadIdsArray = leadIds.split(','); // Convert leadIds string to array
      query._id = { $in: leadIdsArray.map((id) => new mongoose.Types.ObjectId(id)) }; // Filter orders by ObjectId
    }

    const orders = await Order.find(query).exec(); // Fetch matching orders
    console.log('Leads Allocated:', orders.length); 

    // Calculate completed leads
    const leadsCompleted = orders.filter(order => order.paymentStatus === 'Paid').length;
    console.log('Leads Completed:', leadsCompleted);

    // Respond with correct information
    res.status(200).json({
      data: orders,
      leadsAllocated: orders.length,  // Total number of orders allocated
      leadsCompleted: leadsCompleted, // Total number of completed orders
    });
    console.log(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
/**
 * Calculates and updates profits when the payment status is "Paid".
 */
async function calculateAndUpdateProfits(order, teamId, memberName) {
  try {
    // Retrieve the result document for the given order
    const result = await Results.findOne({ orderId: order._id });

    if (!result) {
      throw new Error('No associated result found for this order.');
    }

    // Calculate profit behind order based on orderType in the result schema
    let profitBehindOrder = 0;
    if (order.paymentStatus === 'Paid') {
      profitBehindOrder = result.orderType === 299 ? 61 : 71; // Check orderType from Results
    }

    // Calculate member profit
    const membersProfit = profitBehindOrder > 0 ? 10 : 0;

    // Update the Results document
    result.profitBehindOrder = profitBehindOrder;
    result.membersProfit = membersProfit;
    result.paymentStatus = 'Paid';
    result.completionDate = new Date();
    result.memberName = memberName; // Ensure memberName is saved
    await result.save();
  } catch (error) {
    console.error('Error calculating and updating profits:', error);
  }
}


/**
 * Reverts profits when the payment status is changed to "Unpaid".
 */
async function revertProfits(order) {
  try {
    // Revert profits to zero
    const result = await Results.findOne({ orderId: order._id });
    if (result) {
      result.profitBehindOrder = 0;
      result.membersProfit = 0;
      result.paymentStatus = 'Unpaid';
      result.completionDate = null; // Clear the completion date
      await result.save();
    }
  } catch (error) {
    console.error('Error reverting profits:', error);
  }
}


// Update payment status
router.patch('/orders/payment-status', authenticateToken, async (req, res) => {
  try {
    const { orderId, paymentStatus } = req.body;

    // Validate required fields
    if (!orderId || !paymentStatus) {
      return res.status(400).json({ message: 'Invalid data provided' });
    }

    // Update the payment status in the database
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { paymentStatus, updatedAt: new Date() }, // Update payment status and timestamp
      { new: true } // Return the updated document after the update
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the payment status has been reverted to "Unpaid" (Undo action)
    // if (paymentStatus === 'Unpaid') {
    //   return res.status(200).json({
    //     message: 'Payment status reverted to Unpaid successfully',
    //     data: updatedOrder,
    //   });
    // }

    // Normal update to "Paid" or other statuses
    // res.status(200).json({
    //   message: 'Payment status updated successfully',
    //   data: updatedOrder,
    // });

     // Fetch teamId and memberName from Results schema based on orderId
     const resultData = await Results.findOne({ orderId: updatedOrder._id });

     if (!resultData) {
       return res.status(404).json({ message: 'No associated result found for this order' });
     }
 
     const teamId = resultData.teamId;
     const memberName = resultData.memberName;
 
     // Handle payment status change to "Unpaid" (Undo action)
     if (paymentStatus === 'Unpaid') {
       // Revert profits
       await revertProfits(updatedOrder);
       return res.status(200).json({
         message: 'Payment status reverted to Unpaid successfully',
         data: updatedOrder,
       });
     }
 
     // Handle payment status change to "Paid"
     if (paymentStatus === 'Paid') {
       // Calculate and update profits
       await calculateAndUpdateProfits(updatedOrder, teamId, memberName);
 
       return res.status(200).json({
         message: 'Payment status updated successfully',
         data: updatedOrder,
       });
     }

    // If the status is neither "Paid" nor "Unpaid", return the updated order
    return res.status(200).json({
      message: 'Payment status updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
