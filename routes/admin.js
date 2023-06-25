
module.exports = router;
var express = require('express');
const { render } = require('../app')
var router = express.Router();
const auth = require('../middleware/auth')
const admin = require('../controllers/admin')



router.get('/login', admin.adminLoadLogin);

router.post('/login', admin.adminCheck);

router.get('/', auth.verifyLogin, admin.productList);

router.get('/add-product', auth.verifyLogin, admin.getAddProduct)

router.post('/add-product', auth.verifyLogin, admin.addProduct)

router.get('/delete-product', auth.verifyLogin, admin.deleteProduct)

router.get('/edit-product/:id', auth.verifyLogin, admin.getEditProduct)

router.post('/edit-product/:id', auth.verifyLogin, admin.editProduct)

router.get('/view-user/:id', auth.verifyLogin, admin.viewUser);

router.get('/search-user', auth.verifyLogin, admin.getSearchUser);

router.post('/search-user', auth.verifyLogin, admin.searchUser);

router.get('/logout', admin.logout);

router.get('/user-manage', auth.verifyLogin, admin.getUserManage);

router.get('/block-user', auth.verifyLogin, admin.blockUser)

router.get('/blocked-users', auth.verifyLogin, admin.getBlockedUsers)

router.get('/unblock-user', admin.unblockUser)

router.get('/category', auth.verifyLogin, admin.getCategory);

router.post('/add-category', auth.verifyLogin, admin.addCategory);

router.get('/remove-category', auth.verifyLogin, admin.removeCategory)
// Add this line to your existing router file
 
router.get('/order-list', auth.verifyLogin, admin.getOrderList)

router.get('/coupon-manage', auth.verifyLogin, admin.getCoupon)

router.get('/remove-coupon', auth.verifyLogin, admin.removeCoupon);

router.get('/add-coupon', auth.verifyLogin, admin.getCreateCoupon)

router.post('/add-coupon',auth.verifyLogin,admin.addCoupon)

router.post('/ordered-product-details',auth.verifyLogin,admin.adminOrderDetailsPOST);

router.post('/admin-order-manage',auth.verifyLogin,admin.changeStatus)

//router.post('/check-products', auth.verifyLogin, admin.checkProductsExist);
  
router.get('/cancel-requests', auth.verifyLogin, admin.getCancelRequests)

router.get('/return-requests',auth.verifyLogin, admin.getReturnRequests)



module.exports = router;


