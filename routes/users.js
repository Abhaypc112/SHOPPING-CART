var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHelper=require('../helpers/user-helpers');
const { response, render } = require('../app');
const session = require('express-session');
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else {
    res.redirect('/login')
  }
    
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(user){
  cartCount=await userHelper.cartCount(req.session.user._id)

 }
  productHelper.getAllproducts().then((products)=>{
    res.render('user/view-products', { products,user,cartCount });
  })
  
});
router.get('/login',(req,res)=>{
  if(req.session.user){
     res.redirect('/')
  }else{
    res.render('user/login',{"loginErr":req.session.userLoginErr})
    req.session.userLoginErr=false

  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    req.session.user=response
    req.session.userLoggedIn=true
    res.redirect('/')

  })
  
})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    
    if(response.status){
      req.session.user=response.user
      req.session.userLoggedIn=true
      req.session.cart=true
      res.redirect('/')
    }else{
      req.session.userLoginErr='Invalid username or password'
      res.redirect('/login')
      
    }
  })

  
})

router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
    let products=await userHelper.getCartProducts(req.session.user._id)
      let total=await userHelper.getTotalAmount(req.session.user._id)
      res.render('user/cart',{products,user:req.session.user,total})
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log('Api Call')
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
 userHelper.changeProductQuantity(req.body).then(async(response)=>{
  response.total=await userHelper.getTotalAmount(req.body.user)
  res.json(response)
 }) 
})
router.post('/remove-cart-product',(req,res)=>{
  userHelper.removeCartProduct(req.body).then((response)=>{ 
    res.json(response)
  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{
    let total=await userHelper.getTotalAmount(req.session.user._id)
    res.render('user/place-order',{total,user:req.session.user})
   
})
router.post('/place-order',verifyLogin, async(req,res)=>{
  let products=await userHelper.getCartProductList(req.body.userId)
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    
    if(req.body['payment-method']==='COD'){
      res.json({codStatus:true})
    }else{
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{

         res.json(response)
      })
    }
    
    
  })
  
}) 
router.get('/order-done',verifyLogin,(req,res)=>{
  res.render('user/order-done',{user:req.session.user}) 
})
router.get('/orders',verifyLogin,async(req,res)=>{
  let orders=await userHelper.getUserOrders(req.session.user._id) 
  res.render('user/orders',{user:req.session.user,orders})
}) 
router.get('/view-order-products/:id',verifyLogin,async(req,res)=>{
  let products=await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-orderd-products',{user:req.session.user,products})
})
router.post('/verify-payment',(req,res)=>{
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false})
  })
 
})

module.exports = router;
