var express = require('express');
var router = express.Router();
const auth = require('../middleware/auth');
const user = require('../controllers/user');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const directory = path.join(__dirname, '../public/images');
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  }
});

const upload = multer({ storage: storage });

router.post('/add-user-image', upload.single('userImage'), user.addUserImage);

router.get('/signup', user.getSignup);

router.post('/signup',auth.userverifyEmail,auth.userverifyPhone,user.signup);

router.get('/login',user.getLogin );

router.post('/login', auth.verifyBlock,auth.userisVerified,user.login );

router.get('/logout',user.logout);

router.get('/search',user.getHome)

router.get('/cart', auth.userVerifyLogin,auth.userverifyBlock,user.getCart);

router.get('/wishlist', auth.userVerifyLogin,user.getWishList);

router.get('/add-to-cart/:id', auth.userVerifyLogin,user.addToCart);

router.get('/check-cart/:id',auth.userVerifyLogin,user.checkCart)

router.get('/wishlist-to-cart/:id', auth.userVerifyLogin,auth.userverifyBlock,user.wishlistToCart);

router.get('/add-to-wishlist/:id', auth.userVerifyLogin,user.addToWishList);

router.get('/', user.getHome);

router.get('/error-page',user.getError)

router.post( '/change-product-quantity',user.changeProductQuantity);

router.get('/single-product/:id',user.getSingleProduct);

router.get('/otp',user.getOtp);

router.post('/send-otp',auth.otpverifyBlock ,user.SendOtp )

router.post('/verify-otp',user.verifyOtp );

router.post('/delete-product-from-cart',auth.userVerifyLogin,user.removefromCart)

router.post('/remove-product-from-wishlist',auth.userVerifyLogin,user.removefromWishList)

router.post('/remove-address',auth.userVerifyLogin,user.removeAddress)

router.get('/verify',user.verifyMail)

router.get('/place-order',auth.userVerifyLogin,auth.userverifyBlock,user.placeOrder)

router.post('/place-order',auth.userVerifyLogin,user.doPlaceOrder)

router.post('/generate-wallet-recharge-order',auth.userVerifyLogin,user.generateWalletRechargeOrder)

router.post('/verify-wallet-recharge-payment',auth.userVerifyLogin,user.verifyWalletRecharge)

router.get('/order-success',auth.userVerifyLogin,user.getOrderPlaced)

router.get('/order-list',auth.userVerifyLogin,user.getOrderList)

router.post('/cancel-order',user.cancelOrder)

router.post('/return-order',user.returnOrder)

router.get('/user-profile',auth.userVerifyLogin,user.getProfile)

router.post('/edit-profile',auth.userVerifyLogin,user.editProfile)

router.post('/save-image',auth.userVerifyLogin,user.changeImage)

router.post('/verify-payment',user.verifyPayment)

router.post('/users/order-summary',auth.userVerifyLogin,user.getOrderSummary)

router.get('/search-category',user.searchCategory )

router.post('/list-category',user.ListCategory)

router.get('/search-products',user.getSearchResults)

router.get('/add-address',auth.userVerifyLogin,user.getAddAddress)

router.post('/apply-coupon',auth.userVerifyLogin,user.verifyCoupon)

router.post('/remove-coupon',auth.userVerifyLogin,user.removeCoupon)

router.post('/add-address',auth.userVerifyLogin,user.addAddress)

router.post('/make-primary-address',auth.userVerifyLogin,user.makePrimaryAddress)

router.get('/reset-password',auth.userVerifyLogin,user.getResetForm)

router.post('/change-password',auth.userVerifyLogin,user.changePasswordController)

router.get('/forgot-password',user.getForgotPassword)

router.post('/verify-change-password-email',user.verifyPasswordEmail)

router.get('/change-password',user.verifyToken)

router.post('/change-forgot-password',user.changeForgotPassword)

// router.post('/apply-filters',auth.userVerifyLogin,user.getOrderList)

router.get('/remove-product', (req, res) => {
  let proId = req.query.id
  productHelpers.removeProduct(proId).then((response) => {
    res.redirect('/admin/')
  })
})

module.exports = router;
