const mongoose= require('mongoose');
require('dotenv').config()

const mongoURL = process.env.URI;
const connectToMongo=async()=>{
    try{
        await mongoose.connect(mongoURL);
        console.log('connect to  mongo  successfull.');
        console.log('-------------------------------');
        // Drop legacy badgeId_1 index if it exists
        mongoose.connection.db.collection('officers').dropIndex('badgeId_1').catch(err => {
            // Ignore error if index does not exist
        });

    }
    catch(err){
        console.log("connect to mongo unsuccessfull",err);
    }
}
module.exports=connectToMongo;