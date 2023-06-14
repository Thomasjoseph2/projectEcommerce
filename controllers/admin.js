
const productHelpers = require('../helpers/product-helper');
const userHelpers = require('../helpers/users-helper');
const adminHelper = require('../helpers/admin-helper');

const adminLoadLogin = function (req, res) {
    if (req.session.admin && req.session.admin.loggedIn) {
        
        res.redirect('/admin'); // Redirect to the dashboard if already logged in
    } else {
        res.render('admin/login', { adminLoginErr: req.session.adminLoginErr, admin: true });
        req.session.adminLoginErr = false;
    }
}

const adminCheck = function (req, res) {
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
}

const productList = function (req, res, next) {
  productHelpers.getAllProducts().then(async (products) => {
    for (let i = 0; i < products.length; i++) {
      const category = await adminHelper.getCategoryById(products[i].productCategory);
      if(category){
      products[i].categoryName = category.categoryName;
      }
    }
    res.render('admin/view-products', { admin: true, products, adminLoggedIn: true });
  });
}

const getAddProduct = async function (req, res) {
    let categories = await adminHelper.getCategory();
    res.render('admin/add-product', { admin: true, categories })
    
}

const addProduct = (req, res) => {
    productHelpers.addProduct(req.body, (data) => {
      let productId = data.insertedId;
      let categoryName = req.body.productCategory;
  
      // Retrieve the category ID based on the category name
      productHelpers.getCategoryId(categoryName, (categoryId) => {
        // Update the product document with the category ID
        productHelpers.updateProductCategory(productId, categoryId, () => {
          let image = req.files.productImage;
          image.mv('./public/product-images/' + productId + '.jpg', (err, done) => {
            if (err) {
              console.log(err);
            } else {
              res.redirect('/admin/add-product');
            }
          });
        });
      });
    });
  };

const deleteProduct = (req, res) => {
    let proId = req.query.id
    productHelpers.deleteProduct(proId).then((response) => {
        res.redirect('/admin/')
    })

}
const getEditProduct = async (req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id)
   let categories= await adminHelper.getCategory();
    res.render('admin/edit-product', { admin: true, product ,categories})
}

const editProduct = (req, res) => {
  let productId = req.params.id;
  let categoryName = req.body.productCategory;

  // Retrieve the category ID based on the category name
  productHelpers.getCategoryId(categoryName, (categoryId) => {
    if (categoryId) {
      productHelpers.updateProduct(productId, req.body, categoryId).then(() => {
        if (req.files) {
          let image = req.files.productImage;
          image.mv('./public/product-images/' + productId + '.jpg', (err) => {
            if (err) {
              console.log(err);
            } else {
              res.redirect('/admin');
            }
          });
        } else {
          res.redirect('/admin');
        }
      });
    } else {
      // Handle the case when the category ID is not found
      console.log('Category not found');
      res.redirect('/admin');
    }
  });
};

  
const viewUser = function (req, res) {
  
    let userId = req.params.id;
    userHelpers.getUserDetails(userId).then((user) => {
        res.render('admin/user-details', { user });
    }).catch((error) => {
        console.log(error);
        res.redirect('/admin');
    });
}
const getSearchUser = function (req, res) {
    res.render('admin/search-user', { admin: true });
}
const searchUser = function (req, res) {
    let searchTerm = req.body.searchTerm;
    userHelpers.searchUser(searchTerm).then((users) => {
        res.render('admin/view-user', { users });
    }).catch((error) => {
        console.log(error);
        res.redirect('/admin');
    });
}

const logout = (req, res) => {
    req.session.admin = null;
    res.redirect('/admin');
}

const getUserManage = async (req, res) => {
    let users = await adminHelper.getUserDetails();
    res.render('admin/user-manage', { admin: true, users });
}

const blockUser = (req, res) => {
    let userId = req.query.id
    adminHelper.blockUser(userId).then(() => {
        res.redirect('/admin/user-manage')
    })

}

const getBlockedUsers = async (req, res) => {
    let user = await adminHelper.getBlockedUserDetails().then((users) => {
        res.render('admin/blocked-users', { admin: true, users })
    })
}
const unblockUser = (req, res) => {
    let userId = req.query.id
    adminHelper.unblockUser(userId).then(() => {
        res.redirect('/admin/blocked-users')
    })

}

const getCategory = async function (req, res) {
    try {
       
        let categories = await adminHelper.getCategory();
        const err=req.session.categoryExistsErr
        req.session.categoryExistsErr=false
        res.render('admin/category', { admin: true, categories: categories ,err});
    } catch (error) {
        console.log(error);
        res.redirect('/admin');
    }
}

const addCategory = async (req, res) => {
    const categoryName  = req.body.categoryName;
    
    try {
      const categoryExists = await adminHelper.checkCategoryExists(categoryName);
  
      if (categoryExists) {
        req.session.categoryExistsErr =true;
        console.log(req.session.categoryExistsErr)
      } else {
         await adminHelper.addCategory({ categoryName }).then((result)=>{
            console.log(result);
         })
       
      }
  
      res.redirect('/admin/category');
    } catch (error) {
      console.log(error);
      res.redirect('/admin');
    }
  };

const removeCategory=(req, res) => {
    let ctId = req.query.id
    adminHelper.removeCategory(ctId).then(() => {
      res.redirect('/admin/category')
    })
  
  }
  
const getOrderList=async(req,res)=>{
   let orders=await adminHelper.getOrderList();
   console.log(orders);
  res.render('admin/order-list',{orders,admin: true })
}
const adminOrderDetailsPOST=async(req,res)=>{
   // let user = req.session.userSession // Used for storing user details for further use in this route
  
    // console.log(req.body);
  
    let orderId = req.body.orderId;
    console.log(orderId);
  
    let productDetails = await adminHelper.getProductsInOrder(orderId);
  // For passing order date to the page
  console.log(productDetails);
  
    // console.log(orderDate);
  
    res.render('admin/ordered-products',{ productDetails,admin: true ,orderId});
  
}
const changeStatus = async (req, res) => {
  try {
    let orderId = req.body.orderId;
    let status = req.body.status;
    
    await adminHelper.changeStatusoOrder(orderId, status);
    
    res.json({ success: true }); // Send JSON response indicating success
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' }); // Send JSON response with error message
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
    changeStatus
  

}




