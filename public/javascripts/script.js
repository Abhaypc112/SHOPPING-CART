
function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        methode:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            }
        } 
    }) 
} 
