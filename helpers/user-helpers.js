var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { response, options } = require('../app')
var objectId=require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { resolve } = require('node:path')
// const { default: payments } = require('razorpay/dist/types/payments')

var instance = new Razorpay({
  key_id: 'rzp_test_mtR164fMRyZwGM',
  key_secret: 'vtBtLGyfhS8W4mpxs5cdqX0T',
}); 
module.exports={

    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.insertId)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log('Login Success')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('Login Faild')
                        resolve({status:false})
                    }
                })
            }else{
                console.log('Login Faild')
                resolve({status:false})
            }
           
            
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:new objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist)
                if(proExist !=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({'products.item':new objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId)},{
                    $push:{products:proObj}
                }
            
            ).then((response)=>{
                    resolve()
                })
            }
            }else{
                let cartObject={
                    user:new objectId(userId),
                    products:[proObj],
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObject).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                
            ]).toArray()

            resolve(cartItems)

        })
    },
    cartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(cart){
                count=cart.products.length
            
            } 
            resolve(count)
        }) 
    },
    changeProductQuantity:(details)=>{
         details.count=parseInt(details.count)
         details.quantity=parseInt(details.quantity)

        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:new objectId(details.cart)},
        {
            $pull:{products:{item:new objectId(details.product)}}
        }
        ).then((response)=>{
            resolve({removeProduct:true})
        })
    
        }else{
             db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:new objectId(details.cart),'products.item':new objectId(details.product)},
        {
            $inc:{'products.$.quantity':details.count}
        }
        ).then((response)=>{
            resolve({status:true})
        })
        }
    })
},
    removeCartProduct:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:new objectId(details.cart)},
            {
                $pull:{products:{item:new objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({removeCartProduct:true})
            })
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                         
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    },
                    
                },
                {
                    
                        $addFields: {
                           
                           product: { $toInt: "$product.price" },
                        }
                    
                },
                {
                    $group:{
                        _id:null,
                        total: { $sum: { $multiply: [ "$quantity","$product"] } },
                    }
                }
                
            ]).toArray()
            resolve(total[0].total)

        })
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deleveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:new objectId(order.userId),
                paymentMethod:order['payment-method'],
                totalAmount:total,
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:new objectId(order.userId)})
                
                resolve(response.insertedId)
            })

        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
                resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:new objectId(userId)}).toArray()
           resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{ 
        return new Promise(async(resolve,reject)=>{
            
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new objectId(orderId)}
                    
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                         
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                    
                },
                
                
                
                
            ]).toArray()
            resolve(orderItems)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options={
                amount: total*100,
                currency: "INR",
                receipt: orderId,
            }
            instance.orders.create(options, function(err,order){
                if(err){
                    console.log(err)
                }else{
                    resolve(order)
                }
            }) 
           
           
})


    },
    verifyPayment:(details)=>{
        
        return new Promise((resolve,reject)=>{
        //    const crypto = require('node:crypto');
        //    let hmac = crypto.createHmac('sha256', 'vtBtLGyfhS8W4mpxs5cdqX0T')

        //    hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_order_payment_id]']);
        //    hmac=hmac.digest('hex')
        //    console.log(hmac)
        //    if(hmac===details['payment[razorpay_signature]']){
        //     console.log('hee')
        //         resolve()
        //    }else{
        //     console.log("fail")
        //     reject()
        //    }
            const { createHmac } = require('node:crypto');

            const secret = 'vtBtLGyfhS8W4mpxs5cdqX0T';
            const hash = createHmac('sha256', secret)
                        .update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
                        .digest('hex');
            if(hash==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
            
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id: new objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
        ).then(()=>{
            resolve()
        })
        })
    }
    
}