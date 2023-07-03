
const productHelpers = require('../helpers/product-helper');
const userHelpers = require('../helpers/users-helper');
const adminHelper = require('../helpers/admin-helper');
const moment = require('moment');

const adminLoadLogin = function (req, res) {
  try {
    if (req.session.admin && req.session.admin.loggedIn) {
      res.redirect('/admin'); // Redirect to the dashboard if already logged in
    } else {
      res.render('admin/login', { adminLoginErr: req.session.adminLoginErr, admin: true });
      req.session.adminLoginErr = false;
    }
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const adminCheck = function (req, res) {
  try {
    if (req.session.admin && req.session.admin.loggedIn) {
      res.redirect('/admin'); // Redirect to the dashboard if already logged in
    } else {
      adminHelper.doLogin(req.body).then((response) => {
        if (response.status) {
          req.session.admin = response.admin;
          req.session.admin.loggedIn = true;
          res.redirect('/admin');
        } else {
          req.session.adminLoginErr = true;
          res.redirect('/admin/login');
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const productList = function (req, res, next) {
  try {
    productHelpers.getAllProducts().then(async (products) => {
      for (let i = 0; i < products.length; i++) {
        const category = await adminHelper.getCategoryById(products[i].productCategory);
        if (category) {
          products[i].categoryName = category.categoryName;
        }
      }
      res.render('admin/view-products', { admin: true, products, adminLoggedIn: true });
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getAddProduct = async function (req, res) {
  try {
    const categories = await adminHelper.getCategory();
    res.render('admin/add-product', { admin: true, categories });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const addProduct = (req, res) => {
  let arrayImage=[]
  for(let i=0;i<req.files.length;i++){
   arrayImage[i]=req.files[i].filename;
  }
  productHelpers.addProduct(req.body,arrayImage,(data) => {
   const productId = data.insertedId;
   let categoryName = req.body.productCategory;

   productHelpers.getCategoryId(categoryName, (categoryId) => {
     productHelpers.updateProductCategory(productId, categoryId, () => {
       // Updated code: Added callback parameter
       res.redirect('/admin/add-product');
     });
   });
 });
};

const addCategoryOffer = async (req, res) => {
  try {
    console.log(req.body);
    const categoryOffer = parseInt(req.body.categoryOffer);
    const categoryId = req.body.categoryId;
    await adminHelper.addOffer(categoryId, categoryOffer).then(() => {
      res.redirect('/admin/category');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const addProductOffer = async (req, res) => {
  try {
    console.log(req.body);
    const productOffer = parseInt(req.body.productOffer);
    const productId = req.body.productId;
    await adminHelper.addproductOffer(productId, productOffer);
    res.redirect('/admin/');
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const removeProductOffer = async (req, res) => {
  try {
    console.log(req.body);
    const productOffer = parseInt(req.body.productOffer);
    const productId = req.body.productId;
    await adminHelper.addproductOffer(productId, productOffer);
    res.redirect('/admin/');
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};
const removeCategoryOffer = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const categoryOffer = 0;
     await adminHelper.addOffer(categoryId,categoryOffer)
    res.send({ message: 'Offer removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred' });
  }
};


const deleteProduct = (req, res) => {
  try {
    const proId = req.query.id;
    productHelpers.deleteProduct(proId).then((response) => {
      res.redirect('/admin/');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getEditProduct = async (req, res) => {
  try {
    const product = await productHelpers.getProductDetails(req.params.id);
    const categories = await adminHelper.getCategory();
    res.render('admin/edit-product', { admin: true, product, categories });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const editProduct = (req, res) => {
  try {
    const productId = req.params.id;
    const categoryName = req.body.productCategory;
    const filenames = req.files.map((file) => file.filename);
    const updatedProduct = {
      productName: req.body.productName,
      productDescription: req.body.productDescription,
      productPrice: parseInt(req.body.productPrice),
    };
    if (req.files && req.files.length > 0) {
      updatedProduct.images = req.files.map((file) => file.filename); // Update with the new image filenames
    }
    console.log(updatedProduct, "hi here i am");

    // Retrieve the category ID based on the category name
    productHelpers.getCategoryId(categoryName, (categoryId) => {
      if (categoryId) {
        productHelpers.updateProduct(productId, updatedProduct, categoryId, req).then(() => {
         
          res.redirect('/admin')
        });
      } else {
        // Handle the case when the category ID is not found
        console.log('Category not found');
        res.redirect('/admin');
      }
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const viewUser = function (req, res) {
  try {
    const userId = req.params.id;
    userHelpers.getUserDetails(userId).then((user) => {
      res.render('admin/user-details', { user });
    }).catch((error) => {
      console.log(error);
      res.redirect('/admin');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getSearchUser = function (req, res) {
  res.render('admin/search-user', { admin: true });
};

const searchUser = function (req, res) {
  try {
    const searchTerm = req.body.searchTerm;
    userHelpers.searchUser(searchTerm).then((users) => {
      res.render('admin/view-user', { users });
    }).catch((error) => {
      console.error(error);
      res.redirect('/admin');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const logout = (req, res) => {
  try {
    req.session.admin = null;
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getUserManage = async (req, res) => {
  try {
    const users = await adminHelper.getUserDetails();
    res.render('admin/user-manage', { admin: true, users });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const blockUser = (req, res) => {
  try {
    const userId = req.query.id;
    adminHelper.blockUser(userId).then(() => {
      res.redirect('/admin/user-manage');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const users = await adminHelper.getBlockedUserDetails();
    res.render('admin/blocked-users', { admin: true, users });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const unblockUser = (req, res) => {
  try {
    const userId = req.query.id;
    adminHelper.unblockUser(userId).then(() => {
      res.redirect('/admin/blocked-users');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getCategory = async function (req, res) {
  try {
    const categories = await adminHelper.getCategory();
    res.render('admin/category', { admin: true, categories: categories, categoryError: req.session.admin.categoryExistsErr });
    req.session.admin.categoryExistsErr = false;
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const addCategory = async (req, res) => {
  try {
    const categoryName = req.body.categoryName;
    const categoryExists = await adminHelper.checkCategoryExists(categoryName);
    if (categoryExists) {
      req.session.admin.categoryExistsErr = true;
      console.log(req.session.admin.categoryExistsErr);
      res.redirect('/admin/category');
    } else {
      await adminHelper.addCategory({ categoryName }).then((result) => {
        console.log(result);
      });
      res.redirect('/admin/category');
    }
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const checkProducts = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;
    const productExists = await productHelpers.isProductExist(categoryId);
    console.log(productExists);
    res.json({ productExists: productExists });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const removeCategory = async (req, res) => {
  try {
    const ctId = req.query.id;
    await adminHelper.removeCategory(ctId);
    res.json({response:true})
  } catch (error) {
    console.error(error);
    res.json({response:false})
    res.redirect('/admin');
  }
};

const getOrderList = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = 4; // Number of orders per page
    const totalOrders = await adminHelper.getTotalOrders();
    const totalPages = Math.ceil(totalOrders / perPage);
    const hasPrevPage = currentPage > 5;
    const hasNextPage = currentPage < totalPages;
    const orders = await adminHelper.getOrdersByPage(currentPage, perPage);

    res.render('admin/order-list', {
      orders,
      admin: true,
      currentPage,
      totalPages,
      hasPrevPage,
      hasNextPage,
      prevPage: currentPage - 1,
      nextPage: currentPage + 1,
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.error(error);
    // Send JSON response with error message
  }
};

const isReturnRequestOrCancelRequest = (status) => {
  return status === "returnrequest" || status === "cancelrequest";
};

const adminOrderDetailsPOST = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const productDetails = await adminHelper.getProductsInOrder(orderId);
    const orderStatus = await adminHelper.getOrderStatus(orderId); // Assuming you have a function to get the order status

    res.render('admin/ordered-products', { productDetails, admin: true, orderId, isReturnRequestOrCancelRequest: isReturnRequestOrCancelRequest(orderStatus) });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const changeStatus = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const status = req.body.status;
    console.log(status);
    const order = await adminHelper.getOrder(orderId);
    await adminHelper.changeStatusOrder(orderId, status);

    console.log(order, "this is the order");
    if (order.paymentMethod === 'COD' && order.OrderStatus === "returnrequest" && status === "returned") {
      await adminHelper.updateWallet(order.userId, order.totalAmound);
    } else if (order.paymentMethod === 'ONLINE' && order.OrderStatus === "cancelrequest" && status === "cancelled") {
      await adminHelper.updateWallet(order.userId, order.totalAmound);
    } else if (order.paymentMethod === 'ONLINE' && order.OrderStatus === "returnrequest" && status === "returned") {
      await adminHelper.updateWallet(order.userId, order.totalAmound);
    } else if ((order.paymentMethod === 'WALLET' && order.OrderStatus === "returnrequest" && status === "returned") ||
      (order.paymentMethod === 'WALLET' && order.OrderStatus === "cancelrequest" && status === "cancelled")) {
      await adminHelper.updateWallet(order.userId, order.totalAmound);
    }
    res.json({ success: true }); // Send JSON response indicating success
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCoupon = async (req, res) => {
  try {
    let coupons = await adminHelper.getAllCoupons();

    // Format the dates in a readable format before rendering the view
    coupons = coupons.map(coupon => {
      coupon.expiryDate = moment(coupon.expiryDate).format('DD/MM/YYYY HH:mm:ss');
      coupon.createdAt = moment(coupon.createdAt).format('DD/MM/YYYY HH:mm:ss');
      return coupon;
    });

    console.log(coupons);
    res.render('admin/coupon-manage', { admin: true, coupons });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getCreateCoupon = (req, res) => {
  try {
    res.render('admin/add-coupon', { admin: true, couponExists: req.session.admin.couponExistsError })
    req.session.admin.couponExistsError = false
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const addCoupon = async (req, res) => {
  try {
    const coupon = req.body;
    const couponExists = await adminHelper.couponExists(coupon.couponcode);
    if (couponExists) {
      req.session.admin.couponExistsError = "coupon already exists";
      res.redirect('/admin/add-coupon');
    } else if (parseInt(coupon.discount) > 100) {
      req.session.admin.couponExistsError = "maximum discount is 100%";
      res.redirect('/admin/add-coupon');
    } else {
      coupon.purchaseamound = parseInt(coupon.purchaseamound);
      coupon.expiary = parseInt(coupon.expiary);
      coupon.discount = parseInt(coupon.discount);
      coupon.removed = false;
      const currentDate = new Date();
      const expiryDate = moment().add(coupon.expiary, 'days').toDate();
      coupon.expiryDate = expiryDate;
      coupon.createdAt = currentDate;
      const coupons = await adminHelper.addCoupon(coupon);
      res.redirect('/admin/add-coupon');
    }
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const removeCoupon = (req, res) => {
  try {
    const couponId = req.query.id;
    adminHelper.removeCoupon(couponId)
      .then(() => {
        res.redirect('/admin/coupon-manage');
      })
      .catch((error) => {
        console.log(error);
        res.redirect('/admin/coupon-manage');
      });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getCancelRequests = async (req, res) => {
  try {
    const cancelRequests = await adminHelper.getCancelRequests();
    res.render('admin/cancel-requests', { cancelRequests });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

const getReturnRequests = async (req, res) => {
  try {
    const returnRequests = await adminHelper.getReturnRequests();
    res.render('admin/return-requests', { returnRequests });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};


module.exports = {
  adminLoadLogin,
  adminCheck,
  productList,
  getAddProduct,
  addProduct,
  deleteProduct,
  getEditProduct,
  editProduct,
  viewUser,
  searchUser, getSearchUser,
  logout,
  getUserManage,
  blockUser,
  getBlockedUsers,
  unblockUser,
  getCategory,
  addCategory,
  removeCategory,
  getOrderList,
  adminOrderDetailsPOST,
  changeStatus,
  getCoupon,
  getCreateCoupon,
  addCoupon,
  removeCoupon,
  getCancelRequests,
  getReturnRequests,
  checkProducts,
  addCategoryOffer,
  addProductOffer,
  removeProductOffer,
  removeCategoryOffer


}




