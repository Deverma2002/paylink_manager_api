const mongoose = require('mongoose');

const ResultsSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  memberName: { type: String, required: true }, // Replace memberId with memberName
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Failed'] },
  profitBehindOrder: { type: Number ,default: 0}, // Profit based on payment status
  membersProfit: { type: Number ,default: 0}, // Member profit for completed orders
  completionDate: { type: Date ,default: 0},
  orderType: { type: Number }, // New field for order type
});

module.exports = mongoose.model('Results', ResultsSchema);
