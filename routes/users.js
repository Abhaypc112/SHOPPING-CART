var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHelper=require('../helpers/user-helpers');
const { response, render } = require('../app');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
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
    res.render('user/view-products', { products,user,cartCount,admin:false });
  })
  
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
     res.redirect('/')
  }else{
    res.render('user/login',{"loginErr":req.session.loginErr})
    req.session.loginErr=false

  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')

  })
  
})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      req.session.cart=true
      res.redirect('/')
    }else{
      req.session.loginErr='Invalid username or password'
      res.redirect('/login')
      
    }
  })

  
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
    let products=await userHelper.getCartProducts(req.session.user._id)
      res.render('user/cart',{products,user})
      
    
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log('Api Call')
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
 userHelper.changeProductCount(req.body).then((response,count)=>{
  res.json({status:true,response,count})
 })
})




module.exports = router;
