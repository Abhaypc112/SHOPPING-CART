var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const { response } = require('../app');

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllproducts().then((products)=>{
    res.render('admin/view-products',{products,admin:true});
  })
  
});

router.get('/add-product',(req,res)=>{
  res.render('admin/add-product',{admin:true})
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

router.get('/edit-product/:id',async(req,res)=>{
  let proId=req.params.id
  product=await productHelper.getProductDetails(proId)
  console.log(product)
    res.render('admin/edit-product',{product,admin:true})
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




module.exports = router;
