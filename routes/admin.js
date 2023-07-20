
var express = require('express');
var router = express.Router();
const auth = require('../middleware/auth')
const admin = require('../controllers/admin')
const multer=require('multer')
const path=require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const directory = path.join(__dirname, '../public/product-images');
      cb(null, directory);
    },
    filename: (req, file, cb) => {
      const name = Date.now() + '-' + file.originalname;
      cb(null, name);
    }
  });
  
  
const upload = multer({ storage: storage })

router.get('/login', admin.adminLoadLogin);

router.get('/error-page',admin.getError)

router.post('/login', admin.adminCheck);

router.get('/', auth.verifyLogin, admin.productList);

router.get('/add-product', auth.verifyLogin, admin.getAddProduct)

router.post('/add-product',upload.array('productImage'), admin.addProduct)

router.post('/add-offer', auth.verifyLogin, admin.addCategoryOffer)

router.post('/add-product-offer', auth.verifyLogin, admin.addProductOffer)

router.post('/Remove-product-offer', auth.verifyLogin, admin.removeProductOffer)

router.get('/delete-product', auth.verifyLogin, admin.deleteProduct)

router.get('/edit-product/:id', auth.verifyLogin, admin.getEditProduct)

router.post('/edit-product/:id', auth.verifyLogin,upload.array('productImage'), admin.editProduct)

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

router.post('/remove-offer', auth.verifyLogin, admin.removeCategoryOffer);

router.get('/sales-report',auth.verifyLogin,admin.getSalesReport)

router.get('/yearly-sales-table',auth.verifyLogin,admin.getSalesTable)

router.get('/monthly-sales-table',auth.verifyLogin,admin.getMontlySales)
 
router.get('/order-list', auth.verifyLogin, admin.getOrderList)

router.get('/coupon-manage', auth.verifyLogin, admin.getCoupon)

router.get('/remove-coupon', auth.verifyLogin, admin.removeCoupon);

router.get('/add-coupon', auth.verifyLogin, admin.getCreateCoupon)

router.post('/add-coupon',auth.verifyLogin,admin.addCoupon)

router.post('/ordered-product-details',auth.verifyLogin,admin.adminOrderDetailsPOST);

router.post('/admin-order-manage',auth.verifyLogin,admin.changeStatus)

router.get('/check-products', auth.verifyLogin, admin.checkProducts);
  
router.get('/cancel-requests', auth.verifyLogin, admin.getCancelRequests)

router.get('/return-requests',auth.verifyLogin, admin.getReturnRequests)

router.get('/download-sales-report',auth.verifyLogin,admin.downloadSalesReport)

module.exports = router;


