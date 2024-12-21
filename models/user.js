const mongoose=require('mongoose');
const bcrypt=require("bcryptjs");

const personschema= new mongoose.Schema({
    name: {
         type: String, 
         required: true 
        },
    email:{
        type:String,
        required:true,
        unique:true
    },
    
    password:{
        type:String,
        required:true
    },
    role: {
        type: String,
        enum: ['Admin', 'TeamLeader', 'Member'], 
        default: 'Member'// This will set the default value to "user"
      },

});
personschema.methods.comparePassword=async function(candidatePassword){
    try{
        return await bcrypt.compare(candidatePassword, this.password);
    }
    catch(err){
        throw err;
    }
}


const User=mongoose.model("User",personschema)
module.exports=User;