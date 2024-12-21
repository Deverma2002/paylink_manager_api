const express = require('express');
const Team = require('../models/Team'); // Import the Team model
const router = express.Router();
const { authenticateToken } = require('../routes/jwt');
const User = require('../models/user'); // Import the User model
const mongoose = require('mongoose');

// Route to create a new team
router.post('/teams', authenticateToken, async (req, res) => {
  try {
    const { teamId, teamName, teamLeaderEmail, capacity, memberEmails } = req.body;

    // Debugging logs
    console.log("Received fields:", { teamId, teamName, teamLeaderEmail, capacity, memberEmails });

    // Check for missing fields
    if (!teamId || !teamName || !teamLeaderEmail || !capacity || !memberEmails) {
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          teamId: !!teamId,
          teamName: !!teamName,
          teamLeaderEmail: !!teamLeaderEmail,
          capacity: !!capacity,
          memberEmails: !!memberEmails,
        },
      });
    }

    // Resolve Team Leader email to userId
    const teamLeader = await User.findOne({ email: teamLeaderEmail });
     if (!teamLeader) {
       return res.status(400).json({ message: 'Invalid team leader email.' });
     }

    if (teamLeader.role !== 'TeamLeader') {
      teamLeader.role = 'TeamLeader';
      await teamLeader.save();
    }

    // Resolve Member emails to userIds
    const members = await User.find({ email: { $in: memberEmails }, role: 'Member' });
    if (members.length !== memberEmails.length) {
      return res.status(400).json({ message: 'One or more member emails are invalid.' });
    }

    // Map members to include both ID and name
    const membersList = members.map(member => ({
      userId: member._id,
      name: member.name,
    }));

    const numMembers = membersList.length;

    // Create the team
    const newTeam = new Team({
      teamId,
      teamName,
      teamLeaderEmail,
      teamLeader: teamLeader._id, // Use userId of the team leader
      capacity,
      memberEmails, // Include memberEmails in the newTeam object

      membersList, // Save the membersList with userId and name
      numMembers,
      userId: req.user.id, // Use userId from token
    });

    await newTeam.save();
    res.status(201).json({ message: 'Team created successfully', team: newTeam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Route to get all teams
// Route to get a specific team by MongoDB _id
// Route to get all teams
// Route to get all teams
router.get('/teams', authenticateToken, async (req, res) => {
  try {
    console.log('User role:', req.user.role);

    let teams;

    if (req.user.role === 'admin') {
      // Admin can fetch all teams
      teams = await Team.find().populate({
        path: 'membersList.userId', // Populate userId to get member details
        select: 'name', // Include only the name field
      });
    } else if (req.user.role === 'TeamLeader') {
      teams = await Team.find({ teamLeader: req.user.id })
        .populate({
          path: 'membersList.userId',
          select: '_id name',
        })
        .populate({
          path: 'teamLeader',
          select: 'name', // Include the Team Leader's name
        });
    } else {
      // Regular user can fetch only their own teams
      const userId = req.user.id;
      teams = await Team.find({ userId }).populate({
        path: 'membersList.userId',
        select: 'name',
      });
    }

    // Transform the populated data to include the member names
    teams = teams.map(team => {
      const membersList = team.membersList.map(member => ({
        userId: member.userId._id, // Keep userId
        name: member.userId.name, // Include the member name
      }));
      return {
        ...team.toObject(),
        membersList,
        teamLeaderName: team.teamLeader?.name || 'Unknown Leader', // Add teamLeaderName
      };
    });

    res.status(200).json(teams);
    console.log("teams:", teams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




// Route to update a team's details
// Route to update a team's details
// Route to update a team's details
// router.put('/teams/:teamId', authenticateToken, async (req, res) => {
//   try {
//     const teamId = req.params.teamId;  // The frontend teamId
//     const { teamName, teamLeaderEmail, capacity, memberEmails } = req.body;

//     console.log('Received payload:', req.body);

//     // Check for missing fields
//     if (!teamName || !teamLeaderEmail || !capacity || !memberEmails) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Resolve Team Leader email to userId
//     const teamLeader = await User.findOne({ email: teamLeaderEmail, role: 'TeamLeader' });
//     if (!teamLeader) {
//       return res.status(400).json({ message: 'Invalid team leader email or role.' });
//     }

//     // Resolve Member emails to userIds
//     const members = await User.find({ email: { $in: memberEmails }, role: 'Member' });
//     if (members.length !== memberEmails.length) {
//       return res.status(400).json({ message: 'One or more member emails are invalid.' });
//     }

//     // Map members to include userId and name
//     const membersList = members.map(member => ({
//       userId: member._id,
//       name: member.name,
//     }));

//     // Find the team by frontend teamId, not MongoDB _id
//     const team = await Team.findOne({ teamId: teamId });

//     if (!team) {
//       return res.status(404).json({ message: 'Team not found' });
//     }

//     // Update the team
//     team.teamName = teamName;
//     team.teamLeader = teamLeader._id;
//     team.capacity = capacity;
//     team.membersList = membersList;
//     team.numMembers = membersList.length;

//     // Save the updated team to the database
//     await team.save();

//     // Populate the updated team with member names
//     const populatedTeam = await Team.findOne({ teamId: teamId }).populate({
//       path: 'membersList.userId',
//       select: 'name',
//     });

//     // Transform the populated data
//     const responseTeam = {
//       ...populatedTeam.toObject(),
//       membersList: populatedTeam.membersList.map(member => ({
//         userId: member.userId._id,
//         name: member.userId.name,
//       })),
//     };

//     res.status(200).json({ message: 'Team updated successfully', team: responseTeam });
//   } catch (error) {
//     console.error(error); // Log the error
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });


router.put('/teams/:id', async (req, res) => {
  const { id } = req.params;
  const { teamName, capacity } = req.body;


  if (!teamName || capacity == null) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    const updatedTeam = await Team.findOneAndUpdate(
      {teamId:id},
      { teamName:teamName, capacity:capacity },
      { new: true } // Return the updated document
    );

    if (!updatedTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ message: 'Team updated successfully', team: updatedTeam });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.delete('/teams/:teamId', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;  // The frontend teamId
    console.log('Team ID:', teamId);

    // Use teamId for querying the team document
    const deletedTeam = await Team.findOneAndDelete({ teamId: teamId });
    console.log('Deleting team with teamId:', teamId);

    if (!deletedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/teams/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; // Team ID
    const { email } = req.body; // Member's email

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the team by teamId
    const team = await Team.findOne({ teamId: id });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if the email already exists in the team's memberEmails
    if (team.memberEmails.includes(email)) {
      return res.status(400).json({ message: 'Member already exists in the team' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add the member to the team
    const newMember = {
      userId: user._id,
      name: user.name,
    };

    team.membersList.push(newMember); // Add to membersList
    team.memberEmails.push(email); // Track member's email
    team.numMembers = team.membersList.length; // Update numMembers

    await team.save();

    res.status(201).json({ message: 'Member added successfully', team });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//showmembers 

router.put('/teams/:teamId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = mongoose.Types.ObjectId.isValid(req.params.userId)
      ? new mongoose.Types.ObjectId(req.params.userId)
      : null;

    if (!userId) {
      return res.status(400).json({ message: 'Invalid userId provided' });
    }

    // Find the team by teamId
    const team = await Team.findOne({ teamId: teamId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Find the member in membersList by userId
    const member = team.membersList.find((member) =>
      member.userId.toString() === userId.toString()
    );
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Update the member's name
    if (req.body.name) {
      member.name = req.body.name;
    }

    // Save the updated team document
    await team.save();

    // Find and update the user in the User schema
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's name
    if (req.body.name) {
      user.name = req.body.name;
      await user.save();
    }

    res.status(200).json({ message: 'Name updated successfully', team, user });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/teams/:teamId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = mongoose.Types.ObjectId.isValid(req.params.userId)
      ? new mongoose.Types.ObjectId(req.params.userId)
      : null;

    if (!userId) {
      return res.status(400).json({ message: 'Invalid userId provided' });
    }

    // Find the team by teamId
    const team = await Team.findOne({ teamId: teamId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Find the member in the membersList by userId
    const memberIndex = team.membersList.findIndex(
      (member) => member.userId.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in the team' });
    }

    // Remove the member from membersList
    const removedMember = team.membersList.splice(memberIndex, 1)[0];

    // Find and remove the corresponding email in memberEmails
    const emailToRemove = await User.findById(userId).select('email').lean();
    if (emailToRemove && emailToRemove.email) {
      team.memberEmails = team.memberEmails.filter((email) => email !== emailToRemove.email);
    }

    // Decrement the numMembers count
    team.numMembers = Math.max(team.numMembers - 1, 0);

    // Save the updated team document
    await team.save();

    res.status(200).json({
      message: 'Member removed successfully',
      team,
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;
