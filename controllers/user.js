const productHelpers = require('../helpers/product-helper');
const userHelper = require('../helpers/users-helper');
const adminHelper = require('../helpers/admin-helper');
const usersHelper = require('../helpers/users-helper');
const { v4: uuidv4 } = require('uuid');
const accountSid = "AC655f2659db56c5504407570babdbd676"
const authToken = "423f1b41a1ef5eba1980daa5b4edc5cb";
const verifySid = "VAb8d4aa3610b51c3ee296c9e5e7209be5";
const client = require("twilio")(accountSid, authToken);
const nodemailer = require('nodemailer');
const { log } = require('handlebars/runtime');
const e = require('express');
const { use } = require('../app');
let phone = "";
//const env=require('dotenv')

const sendVerifyMail = async (name, email, userId) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'jarred61@ethereal.email',
        pass: 'VSbH1STJjAyhpnUXh7'
      }
    });
    const mailOptions = {
      from: 'smtp.ethereal.email',
      to: email,
      subject: "For verification mail",
      html: '<p>Hi ' + name + ' ,please click here to <a href="http://localhost:3000/verify?id=' + userId + '">Verify </a>  your mail.</p> '
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been send", info.response);
      }
    })

  } catch (err) {
    console.log(err);
    
  }
}

const verifyMail = async (req, res) => {
  try {
    const response = await userHelper.userVerified(req.query.id)
    console.log(response);
    res.render("users/email-verified")
  } catch (err) {
    console.log(err);
  }
}


const getSignup = (req, res) => {
  try {
    res.render('users/signup', { verifyErr: req.session.verifyLoginError });
    req.session.verifyLoginError = false;
  } catch (err) {
    console.log(err);
  }
}


const signup = async (req, res) => {
  try {
    let walletAmount=0;
    const referralCode = uuidv4().slice(0, 6);
    if(req.body.referalCode){
      const referalExist=await userHelper.isReferalExist(req.body.referalCode)
      if(referalExist){
         walletAmount=500
         await userHelper.updateWallet(referalExist,walletAmount)
      }
    }
    const response = await userHelper.doSignup(req.body,referralCode,walletAmount)
    sendVerifyMail(req.body.name, req.body.email, response.insertedId)
    if (response) {
      res.render('users/signup', { message: "Your registration has been successful, Please verify your email" })
     
    } else {
      res.render('users/signup', { message: "Your registration has failed" })
    }
  } catch (err) {
    console.log(err);
  }
}

// const addUserDetails = async (req, res) => {
//   try {

//     await userHelper.addUserDetails(req.session.user._id, req.body);
//     res.redirect('/');
//   } catch (err) {
//     console.log(err);
//     res.redirect('/');

//   }
// }
const addAddress=async (req, res) => {
  try {
    await userHelper.adduserAddress(req.session.user._id,req.body);
    res.redirect('/add-address');
  } catch (err) {
    console.log(err);
    res.redirect('/')
  } 
}
const addUserImage=async (req, res) => {
  try {
    console.log(req.file)
    let image=req.file.filename;
    await userHelper.addUserImage(req.session.user._id,image);
    res.redirect('/user-profile');
  } catch (err) {
    console.log(err);
    res.redirect('/')
  } 
}

const makePrimaryAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.body.addressId;

    await userHelper.makePrimaryAddress(userId, addressId);

    res.json({ addressMadePrimary: true });
  } catch (err) {
    console.log(err);
    res.json({ addressMadePrimary: false, error: err.message });
  }
}


const getLogin = (req, res) => {
  try {
    if (req.session.user && req.session.user.loggedIn) {
      res.redirect('/');
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.render('users/login', { loginErr: req.session.userLogginErr, notVerified: req.session.verificationErr, blocked: req.session.blocked });
      req.session.userLogginErr = false;
      req.session.verificationErr = false;
      req.session.blocked = false;
    }
  } catch (err) {
    console.log(err);
  }
};

const login = (req, res) => {
  try {
    userHelper.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.user = response.user;
        req.session.user.loggedIn = true;
        res.redirect('/');
      } else {
        req.session.userLogginErr = true;
        res.redirect('/login');
      }
    });
  } catch (err) {
    console.log(err);
  }
}

const logout = (req, res) => {
  try {
    if (req.session.user.otploggedin) {
      req.session.user.otploggedin = false;
    }
    req.session.user.loggedIn = false;
    req.session.user = null;
    res.redirect('/');
  } catch (err) {
    console.log(err);
  }
}

const getCart = async (req, res) => {
  try {
    const products = await userHelper.getCartProducts(req.session.user._id);
    console.log(products,"kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")
    //   products.forEach((product) => {
    //   const offerPercentage = product.product.productOffer || 0; // Get the productOffer, defaulting to 0 if not present
    //   const offerPrice = product.quantity * (1 - offerPercentage / 100) * product.product.productPrice;
    //   product.total = parseInt(offerPrice);
    // });

    const Carttotal = await userHelper.getCartTotal(req.session.user._id);

    res.render('users/cart', { products, user: req.session.user, Carttotal });
  } catch (err) {
    console.log(err);
  }
}

const getWishList = async (req, res) => {
  try {
    const products = await userHelper.wishlistProducts(req.session.user._id);
    res.render('users/wishlist', { products, user: req.session.user });
  } catch (err) {
    console.log(err);
  }
};

const addToCart = (req, res) => {
  console.log("hiiii trying to add to the cart ",req.params.proId)
  try {
    if (!req.session.user || !req.session.user.loggedIn) {
      res.json({ message: "Please log in to add items to the cart" });
      return;
    }

    userHelper
      .addToCart(req.params.id, req.session.user._id)
      .then(() => {
        console.log("added to cart");
        // Send a response indicating that the product was added successfully
        res.json({ message: "Added to cart" });
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        // Send an error response if there was an issue adding the product
        res.status(500).json({ message: "Error adding to cart" });
      });
  } catch (err) {
    console.log(err);
  }
};

const wishlistToCart=async (req,res)=>{
  try {
    if (!req.session.user || !req.session.user.loggedIn) {
      res.json({ message: "Please log in to add items to the cart" });
      return;
    }

    await userHelper
      .addToCart(req.params.id, req.session.user._id)
      .then(async() => {
       //await userHelper.removeItemFromWishlist(req.params.id,req.session.user._id)
        console.log("added to cart");
        res.json({ message: "Added to cart" });
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        // Send an error response if there was an issue adding the product
        res.status(500).json({ message: "Error adding to cart" });
      });
  } catch (err) {
    console.log(err);
  }
}
const addToWishList=(req,res)=>{
  try {
    if (!req.session.user || !req.session.user.loggedIn) {
      res.json({ message: "Please log in to add items to the wish list" });
      return;
    }

    userHelper
      .addToWishList(req.params.id, req.session.user._id)
      .then(() => {
        console.log("added to wishlist");
        // Send a response indicating that the product was added successfully
        res.json({ message: "Added to wishlist" });
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        // Send an error response if there was an issue adding the product
        res.status(500).json({ message: "Error adding to cart" });
      });
  } catch (err) {
    console.log(err);
  }
}
const getSearchResults = async (req, res) => {
  try {
    const searchQuery = req.query.search;
    const products = await userHelper.searchProducts(searchQuery);
    res.render('users/view-products', { products, user: req.session.user });
  } catch (err) {
    console.log(err);
  }
};
const getAddAddress=async(req,res)=>{
  try {
    const address=await userHelper.getUserAddress(req.session.user._id);
    console.log(address)
    res.render('users/add-address', { user: req.session.user,address });
  } catch (err) {
    console.log(err);
  }
}
const getHome = async function (req, res, next) {
  try {
    const user = req.session.user;
    let cartCount = null;
    const page = parseInt(req.query.page) || 1;
    const productPerPage = 8;

    const totalProducts = await userHelper.getTotalProductCount();

    userHelper.getAllProductsForHome(page, productPerPage, totalProducts).then((result) => {
      
      const { products, totalPages } = result;
     res.render('users/view-products', { products, user, cartCount, currentPage: page, totalPages });
    });
  } catch (err) {
    console.log(err);
  }
};

const changeProductQuantity = (req, res, next) => {
  try {
    userHelper.changeProductQuantity(req.body).then(async (response) => {
      let Carttotal = await userHelper.getCartTotal(req.body.user);
      let eachTotal = await userHelper.getEachTotal(req.body.user);
      console.log(eachTotal);
      response.Carttotal = Carttotal
      response.eachTotal = eachTotal
      res.json(response)
    }).catch((err) => {
      res.status(500).send('Error changing quantity');
    });
  } catch (err) {
    console.log(err);
  }
}

const getSingleProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productHelpers.getProductById(productId);
    console.log(product);
    res.render('users/single-product', { product, user: req.session.user });
  } catch (error) {
    console.error('Error occurred while fetching product:', error);
    res.redirect('/error-page'); // Handle the error appropriately
  }
}

const getOtp = (req, res) => {
  try {
    if (req.session.user && req.session.user.loggedIn) {
      res.redirect('/');
      console.log(req.session.user, req.session.user.loggedIn)
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.render('users/otp', { phoneError: req.session.phoneError, otpError: req.session.otpError, blocked: req.session.blocked });
      req.session.phoneError = false;
      req.session.otpError = false;
      req.session.blocked = false; // Reset the error flag after displaying it
    }
  } catch (err) {
    console.log(err);
  }
};

const SendOtp = async (req, res) => {
  try {
    phone = "+91" + req.body.phoneNumber;
    console.log(phone, "hhhhhhhhhhhhhhhhhhhh");
    let user = await userHelper.searchUser(phone);
    console.log(user, "user consoled");
    if (user) {
      client.verify.v2
        .services(verifySid)
        .verifications.create({ to: phone, channel: "sms" })
        .then((verification) => console.log(verification.status));
    } else {
      req.session.phoneError = "user not found";
      res.redirect('/otp');
    }
  } catch (err) {
    console.log(err);
  }
};

const verifyOtp = async (req, res) => {
  try {
    console.log(phone)
    const otpCode = req.body.otp;
    client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phone, code: otpCode })
      .then(async (verification_check) => {
        console.log(verification_check.status);
        if (verification_check.status === "approved") {
          let user = await userHelper.isPhoneVerified(phone);
          if (user) {
            console.log(user);
            req.session.user = user;
            req.session.user.loggedIn = true;
            req.session.user.otploggedin = true
            res.redirect('/');
          } else {
            req.session.phoneError = "User not verified";
            res.redirect('/otp')
          }
        } else {
          req.session.otpError = "Invalid OTP";
          res.redirect('/otp');
        }
      })
      .catch((error) => {
        console.error('Error occurred during OTP verification:', error);
        res.redirect('/otp'); // Handle the error appropriately
      });
  } catch (error) {
    console.error('Error occurred during OTP verification:', error);
    res.redirect('/error-page'); // Handle the error appropriately
  }
}







const removefromCart = async (req, res, next) => {
  try {
    const response = await usersHelper.deleteProductFromCart(req.body);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const removefromWishList = async (req, res, next) => {
  try {
   const response= await userHelper.removeItemFromWishlist(req.body.proId,req.session.user._id)
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const removeAddress= async (req, res, next) => {
  try {
   const response= await userHelper.removeAddress(req.body.addressId,req.session.user._id)
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    
    const orderId = req.body.orderId;
  
    const response = await userHelper.cancelOrder(orderId);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const returnOrder= async (req, res) => {
  try {
   // console.log(req.body);
    const orderId = req.body.orderId;
   // console.log(orderId);
    const response = await userHelper.returnOrder(orderId);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const placeOrder = async (req, res, next) => {
  try {
    let total = 0;
    const products = await userHelper.getCartProducts(req.session.user._id);
    const address=await userHelper.getUserAddress(req.session.user._id);
    const carttotal = await userHelper.getCartTotal(req.session.user._id);
    console.log(carttotal,"checking cart total");
    const discountedAmount = await userHelper.getDiscountedAmount(req.session.user._id);
    //const checkCartTotl = await userHelper.getCheckCartTotl(req.session.user._id);

    if (discountedAmount ) {
      total = discountedAmount ;
    } else {
      total = carttotal;
    }
    products.forEach((product) => {
      product.total = product.product.productPrice * product.quantity;
    });
    req.session.user.newtotal=0;
    const user=await userHelper.getUser(req.session.user._id);
    res.render('users/place-order', { total, user, products, carttotal,address});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const doPlaceOrder = async (req, res) => {
  try {
    
    console.log(req.body,"jgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg");
   
    const products = await userHelper.getcartProductList(req.session.user._id);

    const discountedAmount = await userHelper.getDiscountedAmount(req.session.user._id);

    const cartTotal = await userHelper.getCartTotal(req.session.user._id);

      

    let total = 0;

    if (discountedAmount) {

      total = discountedAmount;

    } else {

      total = cartTotal;

    }

    const response = await userHelper.placeOrder(req.body, products, total,req.session.user._id);

    if (req.body['payment-method'] === 'COD') {

      res.json({ codStatus: true });

    }else if(req.body['payment-method'] === 'WALLET'){

      // Deduct the order total from the user's wallet amount
      
      const user = await userHelper.getUser(req.session.user._id);

      if (user.walletAmount >= total) {

        // Sufficient wallet balance, proceed with the order

        await userHelper.deductAmountFromWallet(req.session.user._id, total);

        await userHelper.updateOrderStatus(response.insertedId, 'walletpayment');

        res.json({ walletStatus: true });

      } else {
        await userHelper.updateOrderStatus(response.insertedId, 'unpaid');
        await userHelper.updateStatus(response.insertedId, 'cancelled');
        // Insufficient wallet balance, handle the error

        res.json({ walletStatus: false, message: 'Insufficient wallet balance' });

      }

    } else if(req.body['payment-method'] === 'ONLINE') {

      const razorpayResponse = await userHelper.generateRazorpay(response.insertedId, total);

      res.json(razorpayResponse);

    }
    couponCode = req.session.user.couponCode;

    await userHelper.updateCouponStatus(req.session.user._id, couponCode);

  } catch (error) {

    console.log(error);

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getOrderPlaced = (req, res) => {
  try {
    res.render('users/order-success');
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getOrderList = async (req, res) => {
  try {
    const orderdetails = await userHelper.getOrderList(req.session.user._id);
    res.render('users/order-list', { orderdetails, user: req.session.user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const getProfile = async(req, res) => {
  try {
    const user=await userHelper.getUser(req.session.user._id)
   
    res.render('users/user-profile', { user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const editProfile= async (req, res) => {
  try {
    console.log(req.body)
     await userHelper.editProfile(req.session.user._id,req.body)
     res.redirect('/user-profile')
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const verifyPayment = (req, res) => {
  try {
    //console.log(req.body);
    userHelper.verifyPayment(req.body)
      .then(() => {
        userHelper.changePaymentStatus(req.body['order[receipt]'])
          .then(() => {
            res.json({ status: true });
          });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getOrderSummary = async (req, res) => {
  try {
    let orderId = req.body.orderId;
    //console.log(orderId);
    let productDetails = await adminHelper.getProductsInOrder(orderId);
    //console.log(productDetails);
    res.render('users/order-summary', { productDetails, user: req.session.user, orderId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const searchCategory = async (req, res) => {
  try {
    const categories = await userHelper.getCategory();
    const products = await productHelpers.getAllProducts();
    res.render('users/categorys-search', { categories, products,user:req.session.user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const ListCategory = async (req, res) => {
  try {
    const catId = await userHelper.getCategoryByName(req.body.status);
    const products = await userHelper.listCategorys(catId._id);
    const categories = await userHelper.getCategory();
    res.render('users/categorys-search', { products, categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const verifyCoupon = async (req, res) => {
  try {
    let couponExist = await userHelper.couponExist(req.body.couponCode);
    
    req.session.user.couponCode = req.body.couponCode;

    if (couponExist) {

      //console.log(couponExist, "the coupon");

      if(couponExist.removed===false){

      const Carttotal = await userHelper.getCartTotal(req.session.user._id);


      const currentDate = new Date();

      if (currentDate <= couponExist.expiryDate) {

        if (Carttotal >= couponExist.purchaseamound) {

          let alreadyUsed = await userHelper.isAlreadyUsed(req.session.user._id, req.body.couponCode);
          
          if (alreadyUsed) {
           
            const discount = Math.floor(couponExist.discount);
            
            let total = parseInt(Carttotal);
           
            const discounted = total * (discount / 100);
            
            const discountedTotal = Math.floor(total - discounted);
            
            req.session.user.newtotal = discountedTotal;
           
            await userHelper.addDiscountedTotal(req.session.user._id, discountedTotal,total)
              
            .then(async (updated) => {
                
              userHelper.addToUsedCoupon(req.session.user._id, req.body.couponCode);
              
            });
            
            res.json({ couponExist: true });
          
          } else {
            
            res.json({ couponExist: false, alreadyUsed: true });
          
          }
        
        } else {
          res.json({ couponExist: false, notApplicable: true });
        }
      } else {
        res.json({ couponExist: false, expired: true });
      }
    }else{
      res.json({couponExist:false, expired:true})
    }
    } else {
      res.json({ couponExist: false });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





module.exports = {
  getSignup,
  signup,
  getLogin,
  login,
  logout,
  getCart,
  addToCart,
  getHome,
  changeProductQuantity,
  getSingleProduct,
  getOtp,
  SendOtp,
  verifyOtp,
  removefromCart,
  verifyMail,
  placeOrder,
  doPlaceOrder,
  getOrderPlaced,
  getOrderList,
  cancelOrder,
  getProfile,
  //getDetailsPage,
  //addUserDetails,
  verifyPayment,
  getOrderSummary,
  searchCategory,
  getSearchResults,
  ListCategory,
  verifyCoupon,
  returnOrder,
  addToWishList,
  getWishList,
  wishlistToCart,
  removefromWishList,
  getAddAddress,
  addAddress,
  removeAddress,
  makePrimaryAddress,
  addUserImage,
  editProfile

};
