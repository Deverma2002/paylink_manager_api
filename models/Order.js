const mongoose = require('mongoose');

// Define the Order schema
const OrderSchema = new mongoose.Schema(
  {
    customerId: { type: String }, // Optional
    source: { type: String }, // Optional
    coupon: { type: String ,default:'not given'}, // Optional
    status: { type: String, enum: ['Pending', 'Success', 'Cancelled', 'Allocated', 'Completed'], default: 'Pending' },
    orderId: { type: String, unique: true }, // Still unique but optional
    link: { type: String }, // Optional
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Failed'], default: 'Unpaid' }, // Optional with default
    paymentModeBy: { type: String, enum: ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer'], default: 'Cash' }, // Optional with default
    state: { type: String, default: 'new' }, // New field added with default value "new"
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', OrderSchema);
