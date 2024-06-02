var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId
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
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({'products.item':new objectId(proId)},
                {
                    $inc:{user:new objectId(userId),'products.$.quantity':1}
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
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{proList:'$products'},
                //         pipeline:[
                //            {
                //             $match:{
                //                 $expr:{
                //                     $in:['$_id',"$$proList"]
                //                 }
                //             }
                //            }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            resolve(cartItems)

        })
    },
    cartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart= await db. get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(cart){
                count=cart.products.length
            
            }
            resolve(count)
        })
    },
    changeProductCount:(details)=>{
         details.count=parseInt(details.count)
        return new Promise((resolve,reject)=>{
             db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:new objectId(details.cart),'products.item':new objectId(details.product)},
        {
            $inc:{'products.$.quantity':details.count}
        }
        ).then((response)=>{
            resolve(response)
        })
        })
    },
   
}