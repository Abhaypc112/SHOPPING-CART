var db=require('../config/connection')
var collection=require('../config/collection')
const { response, resource } = require('../app')
var objectId=require('mongodb').ObjectId

module.exports={
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let email='admin@gmail.com'
            let password='123'
            if(email==userData.email){
                    if(password==userData.password){
                        console.log('Login Success')
                        response.admin=true
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('Login Faild')
                        resolve({status:false})
                    }
                }else{
                    console.log('Login Faild')
                    resolve({status:false})
            }
            
    })
},
getAllOrders:()=>{
    return new Promise(async(resolve,reject)=>{
       let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
       resolve(orders)
    })
},
    getAllUsers:()=>{
        return new Promise(async(resolve,response)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    }
}