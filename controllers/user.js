const productHelpers = require('../helpers/product-helper');
const userHelper = require('../helpers/users-helper');
const adminHelper = require('../helpers/admin-helper');
const usersHelper = require('../helpers/users-helper');
const accountSid = "AC655f2659db56c5504407570babdbd676";
const authToken = "423f1b41a1ef5eba1980daa5b4edc5cb";
const verifySid = "VAb8d4aa3610b51c3ee296c9e5e7209be5";
const client = require("twilio")(accountSid, authToken);
const nodemailer=require('nodemailer');
const { log } = require('handlebars/runtime');
const e = require('express');
let phone="";

const sendVerifyMail=async (name,email,userId)=>{
    try{
   const transporter=nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure:false,
        requireTLS:true,
        auth: {
            user: 'jarred61@ethereal.email',
            pass: 'VSbH1STJjAyhpnUXh7'
        }
    });
    const mailOptions={
      from:'smtp.ethereal.email',
      to:email,
      subject:"For veridication mail",
      html:'<p>Hi '+name+' ,please click here to <a href="http://localhost:3000/verify?id='+userId+'">Verify </a>  your mail.</p> '
    }
    transporter.sendMail(mailOptions,function(error,info){
      if(error){
        console.log(error);
      }else{
        console.log("email has been send",info.response);
      }
    })

    }catch(err){
      console.log(err);
    }
}

const verifyMail=async (req,res )=>{
  try{
  let response= await userHelper.userVerified(req.query.id)
  console.log(response);
  res.render("users/email-verified")
  }catch(err){
    console.log(err);
  }
}


const getSignup = (req, res) => {
  res.render('users/signup',{verifyErr:req.session.verifyLoginError});
  req.session.verifyLoginError=false;
}

const signup = async (req, res) => {
let response=await  userHelper.doSignup(req.body)
  sendVerifyMail(req.body.name,req.body.email,response.insertedId)
  if(response){
    res.render('users/signup',{message:"Your registration has been successfull, Please verify your email"})
}else{
    res.render('users/signup',{message:"Your registration has been failed"})
}
} 

const addUserDetails= async (req,res)=>{
  
  await userHelper.addUserDetails(req.session.user._id,req.body);
  res.redirect('/')
}

const getLogin = (req, res) => {
  if (req.session.user && req.session.user.loggedIn) {
    res.redirect('/');
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.render('users/login', { loginErr: req.session.userLogginErr,notVerified: req.session.verificationErr,blocked:req.session.blocked});
    req.session.userLogginErr = false;
    req.session.verificationErr=false;
    req.session.blocked=false;

  }
};

const login = (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    console.log(response);
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      res.redirect('/');
    } else {
     
      req.session.userLogginErr = true;
      res.redirect('/login');
    }
  });
}

const logout = (req, res) => {
  if (req.session.user.otploggedin) {
    req.session.user.otploggedin = false;
     }
  req.session.user.loggedIn = false;
  req.session.user = null;
  res.redirect('/');
}

const getCart = async (req, res) => {
  console.log(req.session.user,"uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");
  let products = await userHelper.getCartProducts(req.session.user._id);
  products.forEach((product) => {
    product.total = product.product.productPrice * product.quantity;
  });
  let Carttotal=await userHelper.getCartTotal(req.session.user._id);
 // let eachTotal=await userHelper.getEachTotal(req.session.user._id)
  console.log(products);
  res.render('users/cart', { products, user: req.session.user ,Carttotal});
}

const addToCart = (req, res) => {
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
};



const getHome = async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  // if (req.session.user) {
  //   cartCount = await userHelper.getCartCount(req.session.user._id);
  // }

  productHelpers.getAllProducts().then((products) => {
    res.render('users/view-products', { products, user, cartCount });
  });
}

const changeProductQuantity = (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async(response) => {
   let Carttotal=await userHelper.getCartTotal(req.body.user);
   let eachTotal=await userHelper.getEachTotal(req.body.user);
   console.log(eachTotal);
   response.Carttotal=Carttotal
   response.eachTotal=eachTotal
  res.json(response)
  }).catch((err) => {
    res.status(500).send('Error changing quantity');
  });
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
 
  if (req.session.user && req.session.user.loggedIn ) {
    res.redirect('/');
    console.log(req.session.user,req.session.user.loggedIn)
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.render('users/otp', { phoneError: req.session.phoneError, otpError: req.session.otpError,blocked:req.session.blocked });
    req.session.phoneError = false;
    req.session.otpError = false;
    req.session.blocked =false; // Reset the error flag after displaying it
  }
};

const SendOtp = async (req, res) => {
  phone = "+91" + req.body.phoneNumber;
  console.log(phone,"hhhhhhhhhhhhhhhhhhhh");
  let user = await userHelper.searchUser(phone);
  console.log(user,"user consoled");
  if (user) {
       client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phone, channel: "sms" })
      .then((verification) => console.log(verification.status));
  } else {
    req.session.phoneError ="user not found";
    res.redirect('/otp');
  }
};




const verifyOtp = async (req, res) => {
  try {
    console.log(phone)
    let otpCode = req.body.otp;
    client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phone, code: otpCode })
      .then(async (verification_check) => {
        console.log(verification_check.status);

        if (verification_check.status === "approved") {
          
          let user = await userHelper.isPhoneVerified(phone);
          if(user){
          console.log(user);
          req.session.user = user;
          req.session.user.loggedIn = true;
          req.session.user.otploggedin=true
          res.redirect('/');
          }else{
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
};







const removefromCart= (req,res,next)=>{

  // console.log(req.body);

  usersHelper.deleteProductFromCart(req.body).then((response)=>{

    res.json(response); 
    /* 
    # Used JSON to send data back here as RESPONSE to AJAX Call from cart page
    # As we are using AJAX there is no need of sending back a complete web page or redirecting to a webpage (which will load the page completely)
    # We can configure the AJAX to use the data in JSON format for updating the specific element of webpage
    */
  
  }).catch((err)=>{

    console.log(err);

    reject(err);
    
  });

}

const cancelOrder=async (req,res)=>{
  console.log(req.body)
    orderId=req.body.orderId;
    console.log(orderId);
 await  userHelper.cancelOrder(orderId).then((response)=>{
    res.json(response)
  }).catch((err)=>{
    console.log(err);
  });
}


const placeOrder= async (req,res,next)=>{
  
  let total=await userHelper.getCartTotal(req.session.user._id)
  let products = await userHelper.getCartProducts(req.session.user._id);
  products.forEach((product) => {
    product.total = product.product.productPrice * product.quantity;
  });
  res.render('users/place-order',{total,user:req.session.user,products})
}
const doPlaceOrder= async (req,res)=>{
   console.log(req.session.user);
  let products=await userHelper.getcartProductList(req.body.userId)
  let total=await userHelper.getCartTotal(req.body.userId)
  console.log(req.body,products,total);
  userHelper.placeOrder(req.body,products,total).then((response)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codStatus:true})
    }else{
      userHelper.generateRazorpay(response.insertedId,total).then((response)=>{
        res.json(response)
      })
    }

  })
}

const getOrderPlaced=(req,res)=>{
  res.render('users/order-success')
}
const getOrderList= async (req,res)=>{
  let orderdetails= await userHelper.getOrderList(req.session.user._id);
    res.render('users/order-list',{orderdetails,user:req.session.user})
  
  
}
const getProfile=(req,res)=>{
 // let userdetails=userHelper.getUserDetails(req.session.user)
 
 res.render('users/user-profile',{user:req.session.user})
}
const  getDetailsPage=(req,res)=>{
  res.render('users/add-details',{user: req.session.user })
}

const verifyPayment=(req,res)=>{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
}
const getOrderSummary=async(req,res)=>{
  // let user = req.session.userSession // Used for storing user details for further use in this route
 
   // console.log(req.body);
 
   let orderId = req.body.orderId;
   console.log(orderId);
 
   let productDetails = await adminHelper.getProductsInOrder(orderId);
 // For passing order date to the page
 console.log(productDetails);
 
   // console.log(orderDate);
 
   res.render('users/order-summary',{ productDetails,user:req.session.user,orderId});
 
}

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
  getDetailsPage,
  addUserDetails,
  verifyPayment,
  getOrderSummary
};
