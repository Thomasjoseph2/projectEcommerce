const productHelpers = require('../helpers/product-helper');
const userHelper = require('../helpers/users-helper');
const adminHelper = require('../helpers/admin-helper');
const admin = require('../controllers/admin')

const verifyLogin = (req, res, next) => {
    if (req.session.admin && req.session.admin.loggedIn) {
      next();
    } else {
      res.redirect('/admin/login');
    }
  }
  const userVerifyLogin = (req, res, next) => {
    if (req.session.user && req.session.user.loggedIn) {
      next();
    } else {
      res.redirect('/login');
    }
  };
  
  // const otpUserVerifyLogin = (req, res, next) => {
  //   if (req.session.user && req.session.user.loggedIn &&req.session.user.otploggedin) {
  //     redirect('/')
  //   } else {
  //     res.redirect('/otp');
  //   }
  // };
  const verifyBlock = async (req, res, next) => {
    try {
      let blocked = await adminHelper.isBlocked(req.body.email);
      if (blocked) {
      req.session.blocked="you are blocked by the admin"
        res.redirect('/login');
      } else {
        next();
      }
    } catch (error) {
      console.error('Error occurred during block verification:', error);
      res.redirect('/error-page'); // Handle the error appropriately
    }
  };
  const otpverifyBlock = async (req, res, next) => {
    try {
      let blocked = await adminHelper.userisSBlocked(req.body.phoneNumber);
      if (blocked) {
        req.session.blocked="user blocked";
        res.redirct('/otp');
      } else {
        next();
      }
    } catch (error) {
      console.error('Error occurred during block verification:', error);
      res.redirect('/otp'); // Handle the error appropriately
    }
  };
  const verifyOtpBlock = async (req, res, next) => {
    try {
      let blocked = await adminHelper.isSBlocked(req.body.phonenumber);
      if (blocked) {
        res.redirect('/blocked');
      } else {
        next();
      }
    } catch (error) {
      console.error('Error occurred during block verification:', error);
      res.redirect('/error-page'); // Handle the error appropriately
    }
  };
   const userisVerified=async (req,res,next)=>{
    try{
      let verified=await userHelper.isVerified(req.body.email)
      if(verified){
        next();
      }else{
        req.session.verificationErr=true
        res.redirect('/login')
       
        
      }

    }catch (err){
      console.log(err);
    }
   }
   const otpuserisVerified=async (req,res,next)=>{
    try{
      let verified=await userHelper.isPhoneVerified(req.body.phoneNumber)
      if(verified){
        next();
      }else{
        req.session.verificationErr=true
        res.redirect('/login')
       
        
      }

    }catch (err){
      console.log(err);
    }
   }
   const isuserVerified=async (req,res,next)=>{
    try{
      let verified=await userHelper. isuserVerified(req.body)
      if(verified){
        next();
      }else{
        res.redirect('/login')
        
      }

    }catch (err){
      console.log(err);
    }
   }
  
  module.exports={
    verifyLogin,
    userVerifyLogin,
    verifyBlock,
    verifyOtpBlock,
    userisVerified,
    isuserVerified,
    otpverifyBlock,
    otpuserisVerified
  }