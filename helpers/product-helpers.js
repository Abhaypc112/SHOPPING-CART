var db=require('../config/connection')
var collection=require('../config/collection')
const { response, resource } = require('../app')
var objectId=require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllproducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            console.log(proId);
            console.log(new objectId(proId) )
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(proId)}).then((response)=>{
            resolve(response);
            console.log('Product is delete')
           })
           
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    updateProduct:(proId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new objectId(proId)},{
                $set:{
                    name:productDetails.name,
                    discription:productDetails.discription,
                    price:productDetails.price,

                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    

}