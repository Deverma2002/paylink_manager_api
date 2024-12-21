const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  teamLeaderEmail: { type: String, required: true }, // Reference Team Leader by email
  memberEmails: [{ type: String }], // Array of member email addresses
  capacity: { type: Number, required: true },
  numMembers: { type: Number,  default: 0 },
  userId: { type: String, ref: 'User', required: true }, // Reference to User as String
  membersList: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Define as a reference
      name: String,
    },
  ],
});

module.exports = mongoose.model('Team', TeamSchema);
