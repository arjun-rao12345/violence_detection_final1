const mongoose = require('mongoose');
const {Schema} = mongoose;

const AdminSchema = new Schema({
    name:{
        type : String,
       
    },
    email:{
        type:String,
        
    },
    password:{
        type:String,
      
    },
    date:{
        type:Date,
        default : Date.now(),
    }

})
module.exports=mongoose.model("admin",AdminSchema);