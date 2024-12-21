const mongoose=require('mongoose')
// const mongoURL='mongodb://localhost:27017/rolebased'
const mongoURL = 'mongodb://watcho:watcho123@10.160.0.56:27017/watchodb';

mongoose.connect(mongoURL)

const db=mongoose.connection;

db.on('connected', () => {
    console.log('MongoDB connected successfully');
});
  
db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});
  
db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});
  
module.exports=db;