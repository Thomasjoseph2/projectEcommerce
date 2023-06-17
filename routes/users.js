var express = require('express');
var router = express.Router();
const auth=require('../middleware/auth')
const user=require('../controllers/user')
// const accountSid = "AC3d28d77a88183ef2695e962fdb125248";
// const authToken = "51a2c439c67245cefb72ab439aade4a5";
// const verifySid = "VA4f89b10c7da39304caf987482707ea03";
// const client = require("twilio")(accountSid, authToken);



let phone = "";

router.get('/signup', user.getSignup);

router.post('/signup',user.signup);

router.get('/login',user.getLogin );

router.post('/login', auth.verifyBlock,auth.userisVerified,user.login );

router.get('/logout',user.logout);

router.get('/cart', auth.userVerifyLogin,user.getCart);

router.get('/add-to-cart/:id', auth.userVerifyLogin,user.addToCart);

router.get('/', user.getHome);

router.post( '/change-product-quantity',user.changeProductQuantity);

router.get('/single-product/:id',user.getSingleProduct);

router.get('/otp',user.getOtp);

router.post('/send-otp',auth.otpverifyBlock ,user.SendOtp )

router.post('/verify-otp',user.verifyOtp );

router.post('/delete-product-from-cart',auth.userVerifyLogin,user.removefromCart)

router.get('/verify',user.verifyMail)

router.get('/place-order',auth.userVerifyLogin,user.placeOrder)

router.post('/place-order',auth.userVerifyLogin,user.doPlaceOrder)

router.get('/order-success',auth.userVerifyLogin,user.getOrderPlaced)

router.get('/order-list',auth.userVerifyLogin,user.getOrderList)

router.post('/cancel-order',auth.userVerifyLogin,user.cancelOrder)

router.get('/user-profile',auth.userVerifyLogin,user.getProfile)

router.get('/add-details',auth.userVerifyLogin,user.getDetailsPage)

router.post('/add-details',auth.userVerifyLogin,user.addUserDetails)

router.post('/verify-payment',auth.userVerifyLogin,user.verifyPayment)

router.post('/users/order-summary',user.getOrderSummary)

router.get('/remove-product', (req, res) => {
  let proId = req.query.id
  productHelpers.removeProduct(proId).then((response) => {
    res.redirect('/admin/')
  })
})

module.exports = router;
