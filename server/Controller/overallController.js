const UserSchema= require('../Models/user');
const OrderSchema = require('../Models/order');
const ProductSchema = require('../Models/product');
const FeedbackSchema = require('../Models/feedback');
const CategorySchema = require('../Models/category');
const PaymentSchema = require('../Models/payment');

const Count = async(req,res)=>{
    try{
        const totalUser = await UserSchema.countDocuments();
        const totalOrder = await OrderSchema.countDocuments();
        const totalProduct = await ProductSchema.countDocuments();
        const totalFeed = await FeedbackSchema.countDocuments();
        const totalCat = await CategorySchema.countDocuments();
        const totalPay = await PaymentSchema.countDocuments();
        //  Fetch all orders
        const allOrders = await OrderSchema.find();

        //  Sum the grandTotal values
        const totalAmount = allOrders.reduce((acc, order) => acc + (order.grandTotal || 0), 0);

        res.json({
            
            success: true,
            User: totalUser,
            Order: totalOrder,
            Product: totalProduct,
            Feed:totalFeed,
            Cat:totalCat,
            Pay:totalPay,
            TotalAmount: totalAmount
        })
    }catch(err) {
        res.json({error:err});
    }
}


module.exports={Count};

