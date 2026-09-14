const mongoose = require('mongoose');
const { Schema } = mongoose;

const LogSchema = new Schema({
   user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
   },
   product_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
   }
},{ timestamps: true });

module.exports = mongoose.model("log", LogSchema);
