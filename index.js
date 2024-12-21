const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt=require("bcryptjs");
require('dotenv').config();
const router=require('./routes/auth')
const teamsRouter = require('./routes/teams'); // Import the new teams router
const ordersRouter = require('./routes/orders'); // Import the orders router
const allocationRouter = require('./routes/allocate'); // Import the allocation router
const leadAllocationsRouter = require('./routes/leadAllocations'); // Import the lead allocations router
const resultsRouter = require('./routes/results'); // Import the results router

const app = express();





// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit JSON payload to 10MB
app.use(express.urlencoded({ extended: true })); // Limit URL-encoded payload to 10MB

// Routes
app.use('/',router);
app.use('/api', teamsRouter); // Add the teams router
app.use('/api', ordersRouter); // Add the orders route here
app.use('/api', allocationRouter);
app.use('/api', leadAllocationsRouter); // Lead allocations routes
app.use('/api', resultsRouter); // Add the results route




const PORT =  5000;
app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
});

exports.app = app;