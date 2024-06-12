var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
var adminHelper=require('../helpers/admin-helpers')
const { response } = require('../app');
const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else {
    res.redirect('/admin/login')
  }
    
}
/* GET users listing. */
router.get('/',verifyLogin, function(req, res, next) {
  productHelper.getAllproducts().then((products)=>{
    res.render('admin/view-products',{products,admin:req.session.admin});
  })
  
});

router.get('/login',(req,res)=>{
  if(req.session.admin){
     res.redirect('/admin')
    }else{
      res.render('admin/login',{"loginErr":req.session.adminLoginErr})
    req.session.adminLoginErr=false
    }
})
router.post('/login',(req,res)=>{
  adminHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin=response.admin
      req.session.adminLoggedIn=true
      res.redirect('/admin')
    }else{
      console.log("hee")
      req.session.adminLoginErr='Invalid username or password'
      res.redirect('/admin/login')
    }
  })
  })
  router.get('/logout',(req,res)=>{
    req.session.admin=null
    req.session.adminLoggedIn=false
    res.redirect('/admin')
  })
router.get('/add-product',verifyLogin,(req,res)=>{
  res.render('admin/add-product',{admin:req.session.admin})
})

router.post('/add-product',(req,res)=>{
  console.log(req.body)
  productHelper.addProduct(req.body,(id)=>{
      let image=req.files.image
      console.log(id)
      image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
        if(!err){
          res.redirect('/admin/add-product')
        }else{ 
          console.log(err) 
        }
      })
      
  })
  
})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId)
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id',verifyLogin,async(req,res)=>{
  let proId=req.params.id
  product=await productHelper.getProductDetails(proId)
  console.log(product)
    res.render('admin/edit-product',{product,admin:req.session.admin})
})
router.post('/edit-product/:id',(req,res)=>{
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    let  id=req.params.id
    res.redirect('/admin')
    if(req.files.image){
      image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg')
  }
  })
})
router.get('/orders',verifyLogin,async(req,res)=>{
  let orders=await adminHelper.getAllOrders() 
  console.log(orders)
  res.render('admin/view-all-orders',{admin:req.session.admin,orders})
}) 
router.get('/users',verifyLogin,async(req,res)=>{
  let users=await adminHelper.getAllUsers()
  res.render('admin/view-all-users',{users,admin:req.session.admin})
})


module.exports = router;
