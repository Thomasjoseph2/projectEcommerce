const productHelpers = require('../helpers/product-helper');
const adminHelper = require('../helpers/admin-helper');
const userHelper = require('../helpers/users-helper');
const randomstring = require('randomstring')
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOCKEN
const verifySid = process.env.VERIFY_SID;
const client = require("twilio")(accountSid, authToken);
let phone = "";

const sendVerifyMail = async (name, email, userId) => {

  try {

    const transporter = nodemailer.createTransport({

      host: 'smtp.gmail.com',

      port: 587,

      secure: false,

      requireTLS: true,

      auth: {

        user: process.env.USER_EMAIL,

        pass: process.env.PASSWORD
      }

    });

    const mailOptions = {

      from: 'smtp.gmail.com',

      to: email,

      subject: "For verification mail",

      html: '<p>Hi ' + name + ' ,please click here to <a href="www.thomasjoseph.online/verify?id=' + userId + '">Verify </a>  your mail.</p> '

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

    res.redirect('/error-page')

  }
}



const verifyMail = async (req, res) => {

  try {

    const response = await userHelper.userVerified(req.query.id)

  

    res.render("users/email-verified")

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')
  }

}


const getSignup = (req, res) => {

  try {

    res.render('users/signup', { verifyErr: req.session.verifyLoginError, emailError: req.session.emailExistErr,phoneError: req.session.phoneExistErr });

    req.session.verifyLoginError = false;

    req.session.emailExistErr = false;

    req.session.phoneExistErr=false

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')

  }

}


const signup = async (req, res) => {

  try {

    let walletAmount = 0;

    const referralCode = uuidv4().slice(0, 6);

    if (req.body.referalCode) {

      const referalExist = await userHelper.isReferalExist(req.body.referalCode)

      if (referalExist) {

        walletAmount = 500

        await userHelper.updateWallet(referalExist, walletAmount)

      }

    }

    const response = await userHelper.doSignup(req.body, referralCode, walletAmount)

    sendVerifyMail(req.body.name, req.body.email, response.insertedId)

    if (response) {

      res.render('users/signup', { message: "Your registration has been successful, Please verify your email" })


    } else {

      res.render('users/signup', { message: "Your registration has failed" })

    }

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')

  }

}

const addAddress = async (req, res) => {

  try {

    await userHelper.adduserAddress(req.session.user._id, req.body);

    res.redirect('/add-address');

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')

  }

}

const addUserImage = async (req, res) => {

  try {

    let image=req.file.filename;

    await userHelper.addUserImage(req.session.user._id, image);

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

      res.render('users/login', { loginErr: req.session.userLogginErr, notVerified: req.session.verificationErr, blocked: req.session.blocked, passwordReset: req.session.passwordReset });

      req.session.passwordReset = false;

      req.session.userLogginErr = false;

      req.session.verificationErr = false;

      req.session.blocked = false;
    }

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')

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

    res.redirect('/error-page')

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

    res.redirect('/error-page')

  }

}

const getCart = async (req, res) => {

  try {

    const products = await userHelper.getCartProducts(req.session.user._id);

    const Carttotal = await userHelper.getCartTotal(req.session.user._id);

    res.render('users/cart', { products, user: req.session.user, Carttotal });

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')
  }

}

const getWishList = async (req, res) => {

  try {

    const products = await userHelper.wishlistProducts(req.session.user._id);

    res.render('users/wishlist', { products, user: req.session.user });

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')

  }

};

const addToCart = async (req, res) => {

  try {

    if (!req.session.user || !req.session.user.loggedIn) {

      res.json({ message: "Please log in to add items to the cart" });

      return;

    }

    const quantity = await userHelper.getProductById(req.params.id);

    if (quantity >= 1) {

      
      userHelper.addToCart(req.params.id, req.session.user._id)
      
      .then(() => {
      
        res.json({ message: "Added to cart" });
      
      })
       
      .catch((error) => {
      
        console.error("Error adding to cart:", error);
      
        res.status(500).json({ message: "Error adding to cart" });
      
      });
    
    }else {
    
      res.json({ message: "Item out of stock" });
    
    }} 
  catch (err) {
  
    console.log(err);
  
    res.redirect('/error-page');
  
  }

};

const checkCart = async (req, res) => {

  try {

    const proId = req.params.id;

    const exists = await userHelper.checkCart(proId, req.session.user._id);

    res.json(exists);

  } catch (err) {

    console.log(err);

    res.redirect('/error-page');

  }

};





const wishlistToCart = async (req, res) => {

  try {
  
    if (!req.session.user || !req.session.user.loggedIn) {
  
      res.json({ message: "Please log in to add items to the cart" });
  
      return;
  
    }

    const quantity = await userHelper.getProductById(req.params.id);

    if (quantity >= 1) {
  
      await userHelper.addToCart(req.params.id, req.session.user._id);
  
      res.json({ message: "Added to cart" });
  
    } else {
  
      res.json({ message: "Item out of stock" });
  
    }
  
  } catch (err) {
  
    console.log(err);
  
    res.redirect('/error-page');
  
  }

};


const addToWishList = (req, res) => {

  try {

    if (!req.session.user || !req.session.user.loggedIn) {

      res.json({ message: "Please log in to add items to the wish list" });

      return;

    }

    userHelper

      .addToWishList(req.params.id, req.session.user._id)

      .then(() => {

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

    res.redirect('/error-page')

  }
}

const getSearchResults = async (req, res) => {

  try {

    const searchQuery = req.query.search;

    const products = await userHelper.searchProducts(searchQuery);

    res.render('users/view-products', { products, user: req.session.user });

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')

  }

};
const getAddAddress = async (req, res) => {

  try {

    const address = await userHelper.getUserAddress(req.session.user._id);


    res.render('users/add-address', { user: req.session.user, address });

  } catch (err) {

    console.log(err);

    res.redirect('/error-page')

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

    res.redirect('/error-page')

  }

};

const changeProductQuantity = (req, res, next) => {

  try {
   
    userHelper.changeProductQuantity(req.body).then(async (response) => {

      let Carttotal = await userHelper.getCartTotal(req.body.user);


      let eachTotal = await userHelper.getEachTotal(req.body.user);

      response.Carttotal = Carttotal

      response.eachTotal = eachTotal

      res.json(response)
    })
      .catch((err) => {

        res.status(500).send('Error changing quantity');

      });

  } catch (err) {

    console.log(err);


    res.redirect('/error-page')

  }

}

const getSingleProduct = async (req, res) => {

  try {

    const productId = req.params.id;

    const product = await productHelpers.getProductById(productId);

    const category = await productHelpers.getCategoryById(product.productCategory)

    res.render('users/single-product', { product, user: req.session.user, category });

  } catch (error) {

    console.error('Error occurred while fetching product:', error);

    res.redirect('/error-page'); // Handle the error appropriately

  }
}
const getResetForm = async (req, res) => {

  try {

    if (req.session.user.passwordMismatch) {

      const passwordNotValid = req.session.user.passwordMismatch;

      res.render('users/reset-password', { passwordNotValid, user: req.session.user });

      req.session.user.passwordMismatch = false;

    } else {

      res.render('users/reset-password', { user: req.session.user });

    }

  } catch (error) {

    console.error('Error occurred while fetching product:', error);

    res.redirect('/users/error-page') // Handle the error appropriately

  }

}
const getError = function (req, res) {

  try {

    res.render('users/error-page');

  } catch (error) {

    console.error(error);

    res.redirect('/');

  }

};



const changePasswordController = async (req, res) => {

  try {

    const newPassword = req.body.newpassword;

    const currentPassword = req.body.currentpassword;

    const passwordMatch = await userHelper.passwordMatch(currentPassword, req.session.user._id);


    if (passwordMatch) {

      const passwordChanged = await userHelper.changePassword(newPassword, req.session.user._id);

      res.redirect('/user-profile');

    } else {

      req.session.user.passwordMismatch = "Current password is not correct";

      res.redirect('/reset-password');

    }

  } catch (error) {

    console.error('Error occurred', error);

    res.redirect('/error-page'); // Handle the error appropriately

  }

}



const getForgotPassword = (req, res) => {

  try {
    if (req.session.message) {
      res.render('users/forgot-password', { emailMessage: req.session.message });
      req.session.message = false;
    } else {
      res.render('users/forgot-password');
    }


  } catch (error) {

    console.error('Error occurred while fetching product:', error);

    res.redirect('/error-page'); // Handle the error appropriately

  }
}

const verifyPasswordEmail = async (req, res) => {
  try {
    const email = req.body.email

    let emailExists = await userHelper.isemailExists(email)

    if (emailExists) {

      const userRandomstring = randomstring.generate();

      await userHelper.addToken(email, userRandomstring)

      await sendForgotPasswordMail(emailExists.name, email, userRandomstring)

      req.session.message = "verification email send check your mail and verify "

      res.redirect('/forgot-password')


    }

  } catch (error) {

    console.error('Error occurred while fetching product:', error);

    res.redirect('/error-page'); // Handle the error appropriately

  }
}

sendForgotPasswordMail = async (name, email, token) => {

  try {

    const transporter = nodemailer.createTransport({

      host: 'smtp.gmail.com',

      port: 587,

      secure: false,

      requireTLS: true,

      auth: {

        user: process.env.USER_EMAIL,

        pass: process.env.PASSWORD
      }

    });

    const mailOptions = {

      from: 'smtp.gmail.com',

      to: email,

      subject: "For Reset Password",

      html: '<p>Hi ' + name + ' ,please click here to <a href="www.thomasjoseph.online/Change-password?token=' + token + '">Reset</a>  your  Password </p> '

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

    res.redirect('/error-page')

  }
}

const verifyToken = async (req, res) => {

  try {

    const token = await userHelper.isTokenExist(req.query.token);


    if (token) {

      res.render("users/set-password", { email: token.email });


    } else {
      res.redirect('/login')
    }

  } catch (err) {

    console.log(err);

    res.redirect('/login')

  }

}


const changeForgotPassword = async (req, res) => {

  try {

    const token = await userHelper.isTokenExist(req.body.email);


    const result = await userHelper.changeForgotPassword(req.body.newPassword, req.body.email);


    await userHelper.addToken(req.body.email, "");

    req.session.passwordReset = true

    res.redirect('/login')

  } catch (error) {

    console.error('Error occurred', error);

    res.redirect('/error-page'); // Handle the error appropriately
  }
}

const getOtp = (req, res) => {

  try {

    if (req.session.user && req.session.user.loggedIn) {

      res.redirect('/');

    } else {

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

      res.render('users/otp', { phoneError: req.session.phoneError, otpError: req.session.otpError, blocked: req.session.blocked });

      req.session.phoneError = false;

      req.session.otpError = false;

      req.session.blocked = false; // Reset the error flag after displaying it
    }

  } catch (err) {

    console.log(err);


    res.redirect('/error-page')

  }

};


const SendOtp = async (req, res) => {

  try {

    phone = "+91" + req.body.phoneNumber;

    const user = await userHelper.searchUser(phone);

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

    res.redirect('/otp')

  }
};


const verifyOtp = async (req, res) => {

  try {


    const otpCode = req.body.otp;

    client.verify.v2

      .services(verifySid)

      .verificationChecks.create({ to: phone, code: otpCode })

      .then(async (verification_check) => {

        if (verification_check.status === "approved") {

          let user = await userHelper.isPhoneVerified(phone);

          if (user) {

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

    const response = await userHelper.deleteProductFromCart(req.body);

    res.json(response);

  } catch (error) {

    console.log(error);

    res.redirect('/error-page')

  }

};


const removefromWishList = async (req, res, next) => {

  try {

    const response = await userHelper.removeItemFromWishlist(req.body.proId, req.session.user._id)

    res.json(response);

  } catch (error) {

    console.log(error);

    res.status(500).json({ error: 'Internal Server Error' });

  }

};

const removeAddress = async (req, res, next) => {

  try {

    const response = await userHelper.removeAddress(req.body.addressId, req.session.user._id)

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
const returnOrder = async (req, res) => {

  try {
   
    const orderId = req.body.orderId;
 
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

    const address = await userHelper.getUserAddress(req.session.user._id);

    let carttotal = await userHelper.getCartTotal(req.session.user._id);

    carttotal = parseInt(carttotal)

    const discountedAmount = await userHelper.getDiscountedAmount(req.session.user._id);

    const checkCartTotl = await userHelper.getCheckCartTotal(req.session.user._id);

    if (carttotal === checkCartTotl) {


      if (discountedAmount) {

        total = discountedAmount;

      } else {

        total = carttotal;

        req.session.couponapplyed = false

        await userHelper.addDiscountedTotalChange(req.session.user._id, total)

      }

    } else {

      total = carttotal

      req.session.couponapplyed = false

      await userHelper.checkCartTotalChange(req.session.user._id);

      const alreadyUsed = await userHelper.isAlreadyUsedCoupon(req.session.user._id, req.session.user.couponCode);
      

      if (alreadyUsed === false) {

        await userHelper.changeCouponStatus(req.session.user._id, req.session.user.couponCode)

      }

      const changed = await userHelper.isChanged(req.session.user._id, req.session.user.couponCode);

      await userHelper.addDiscountedTotalChange(req.session.user._id, total)

      if (changed) {

        req.session.couponDeclined = true

      }
      else {

        req.session.couponDeclined = false

      }

    }

    products.forEach((product) => {
      if (product.appliedOffer === 'Product Offer') {
        product.total = product.product.offerPrice * product.quantity;
      } else if (product.appliedOffer === 'Category Offer') {
        const discountPercentage = product.appliedOfferValue / 100;
        const discountedPrice = product.product.productPrice * (1 - discountPercentage);
        product.total = discountedPrice * product.quantity;
      }
    });


    req.session.user.newtotal = 0;

    const user = await userHelper.getUser(req.session.user._id);


    res.render('users/place-order', { total, user, products, carttotal, address, coupon: req.session.couponapplyed, declined: req.session.couponDeclined,couponCode:req.session.couponCode });


  } catch (error) {

    console.log(error);

    res.redirect('/error-page')

  }
};

const doPlaceOrder = async (req, res) => {

  try {

    req.session.couponDeclined = false;

    const products = await userHelper.getcartProductList(req.session.user._id);

    const discountedAmount = await userHelper.getDiscountedAmount(req.session.user._id);

    const cartTotal = await userHelper.getCartTotal(req.session.user._id);

   

    let total = 0;

    if (discountedAmount) {

      total = discountedAmount;

    } else {

      total = cartTotal;

    }

    const response = await userHelper.placeOrder(req.body, products, total, req.session.user._id);

    if (req.body['payment-method'] === 'COD') {

      res.json({ codStatus: true });

    } else if (req.body['payment-method'] === 'WALLET') {

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

        // total=total-user.walletAmount

        // const razorpayResponse = await userHelper.generateRazorpay(response.insertedId, total);

        // res.json(razorpayResponse);

      }

    } else if (req.body['payment-method'] === 'ONLINE') {

      const razorpayResponse = await userHelper.generateRazorpay(response.insertedId, total);

      res.json(razorpayResponse);

    }
    couponCode = req.session.user.couponCode;

    await userHelper.updateCouponStatus(req.session.user._id, couponCode);

    for (const product of products) {

      await productHelpers.decrementQuantity(product.item, product.quantity);

    }

  } catch (error) {

    console.log(error);

   res.redirect('/error-page')


  }
};

const getOrderPlaced = (req, res) => {

  try {

    res.render('users/order-success');

  } catch (error) {

    console.log(error);

    res.redirect('/error-page')



  }

};

 const getOrderList=(req, res) => {

  const { status, paymentMethod } = req.query;

  const filters = {

    status: status || '',

    paymentMethod: paymentMethod || '',

  };

  userHelper.getOrderList(req.session.user._id, filters)

    .then((orderdetails) => {

      res.render('users/order-list', { orderdetails, user: req.session.user });

    })

    .catch((error) => {

      console.log(error);

      res.redirect('/error-page');

    });

  }



const getProfile = async (req, res) => {

  try {

    const user = await userHelper.getUser(req.session.user._id)

    const coupons=await userHelper.getCoupons(req.session.user._id);

    res.render('users/user-profile', { user ,coupons});
  }
  catch (error) {

    console.log(error);

    res.redirect('/error-page')

  }

};

const editProfile = async (req, res) => {

  try {

    await userHelper.editProfile(req.session.user._id, req.body)

    res.redirect('/user-profile')

  } catch (error) {

    console.log(error);

    res.redirect('/error-page')
  }

};


const changeImage = async (req, res) => {
  try {
    // Retrieve the image data from the request body
    const imageData = req.body.image;


    // Generate a unique filename for the image (e.g., using a UUID library)
    const filename = generateUniqueFilename();

    // Extract the base64 data from the image data
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    // Convert the base64 data to a buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Save the image buffer to a file
    fs.writeFile(`/images/${filename}.png`, buffer, (err) => {
      if (err) {
        console.error('Error saving image:', err);
        res.status(500).send('Error saving image');
      } else {
        console.log('Image saved successfully');

        // Update the user's image field in the database
        User.findByIdAndUpdate(req.user._id, { image: filename }, (err, user) => {
          if (err) {
            console.error('Error updating user:', err);
            res.status(500).send('Error updating user');
          } else {
            res.sendStatus(200);
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.redirect('/error-page');
  }
};


const verifyPayment = (req, res) => {

  try {

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

    const orderId = req.body.orderId;

    const productDetails = await adminHelper.getProductsInOrder(orderId);

    res.render('users/order-summary', { productDetails, user: req.session.user, orderId });

  } catch (error) {

    console.log(error);

    res.redirect('/error-page')

  }

};


const searchCategory = async (req, res) => {

  try {

    const categories = await userHelper.getCategory();

    const products = await productHelpers.getAllProducts();

    res.render('users/categorys-search', { categories, products, user: req.session.user });

  } catch (error) {

    console.log(error);

    res.redirect('/error-page')

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

    res.redirect('/error-page')

  }

};



const verifyCoupon = async (req, res) => {

  try {

    const couponExist = await userHelper.couponExist(req.body.couponCode);

    req.session.user.couponCode = req.body.couponCode;

    if (couponExist) {

      //console.log(couponExist, "the coupon");

      if (couponExist.removed === false) {

        const Carttotal = await userHelper.getCartTotal(req.session.user._id);


        const currentDate = new Date();

        if (currentDate <= couponExist.expiryDate) {

          if (Carttotal >= couponExist.purchaseamound) {

            const alreadyUsed = await userHelper.isAlreadyUsed(req.session.user._id, req.body.couponCode);

            if (alreadyUsed) {

              const discount = Math.floor(couponExist.discount);

              let total = parseInt(Carttotal);

              const discounted = total * (discount / 100);

              const discountedTotal = Math.floor(total - discounted);

              req.session.user.newtotal = discountedTotal;

              req.session.couponapplyed = true;

              req.session.couponCode=req.body.couponCode;

              if (req.session.couponDeclined) {

                req.session.couponDeclined = false

              }

              await userHelper.addDiscountedTotal(req.session.user._id, discountedTotal, total)

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
        }
        else {

          res.json({ couponExist: false, expired: true });
        }
      } else {

        res.json({ couponExist: false, expired: true })
      }

    } else {
      res.json({ couponExist: false });
    }

  } catch (error) {

    console.log(error);

    res.status(500).json({ error: 'Internal Server Error' });

  }
};
const removeCoupon = async (req, res) => {

  try {
   


    const couponCode = req.body.couponCode;

    await userHelper.removeAppliedCoupon(couponCode, req.session.user._id);

    let carttotal = await userHelper.getCartTotal(req.session.user._id);

    await userHelper. addChangedTotal(req.session.user._id,carttotal);

    req.session.couponapplyed = false;

    res.json({ couponRemoved: true });

  } catch (error) {

    console.log(error);

    res.redirect('/error-page');

  }
};




const generateWalletRechargeOrder = async (req, res) => {
  try {
    const user = req.session.user._id;
    
    const total = req.body.total;

    const razorpayResponse = await userHelper.generateRazorpayForWallet(user, total);

    res.json(razorpayResponse);

  } catch (error) {

    console.error('Error generating wallet recharge order:', error);

    res.redirect('/error-page')
  }
};



const verifyWalletRecharge  = (req, res) => {

  try {

    userHelper.verifyPayment(req.body)
    
    .then(() => {

      const razorpayAmount=parseInt(req.body['order[amount]'])

      const amount=parseInt(razorpayAmount/100)

       userHelper. updateWallet(req.body['order[receipt]'],amount)

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

    res.redirect('/error-page')

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
  editProfile,
  getResetForm,
  changePasswordController,
  getForgotPassword,
  verifyPasswordEmail,
  verifyToken,
  changeForgotPassword,
  getError,
  changeImage,
  checkCart,
  generateWalletRechargeOrder,
  verifyWalletRecharge,
  removeCoupon

};
