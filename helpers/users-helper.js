const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { response } = require('../app');
const { promises } = require('nodemailer/lib/xoauth2');
const { resolve } = require('promise');
const Razorpay = require('razorpay');
var instance = new Razorpay({
 key_id: 'rzp_test_4VSqO0TCBFvtCE',
 key_secret: '4iUcWrjuqM0RKejSrKHisBif' 
})
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        userData.password = await bcrypt.hash(userData.password, 10);
        userData.blocked = false;
        userData.isVerified=false;
        const response = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = {};
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email });
        if (user) {
          const status = await bcrypt.compare(userData.password, user.password);
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  addToCart: (proId, userId) => {
    const proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      try {
        const userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) });
        if (userCart) {
          const proExist = userCart.products.findIndex((product) => product.item.toString() === proId);
          if (proExist !== -1) {
            await db.get().collection(collection.CART_COLLECTION).updateOne(
              { user: ObjectId(userId), 'products.item': ObjectId(proId) },
              {
                $inc: { 'products.$.quantity': 1 },
              }
            );
            resolve();
          } else {
            await db.get().collection(collection.CART_COLLECTION).updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            );
            resolve();
          }
        } else {
          const cartObj = {
            user: ObjectId(userId),
            products: [proObj],
          };
          const response = await db.get().collection(collection.CART_COLLECTION).insertOne(cartObj);
          resolve(response);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cartItems = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: ObjectId(userId) },
            },
            {
              $unwind: '$products',
            },
            {
              $project: {
                item: '$products.item',
                quantity: '$products.quantity',
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: 'item',
                foreignField: '_id',
                as: 'product',
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ['$product', 0] },
               
              
              }
            }
          ])
          .toArray();
  
        resolve(cartItems);
      } catch (error) {
        reject(error);
      }
    });
  },
  

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = 0;
        const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) });
        if (cart) {
          count = cart.products.length;
        }
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
  },

  searchUser: (searchTerm) => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: searchTerm });
        console.log(user);
        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  },

  changeProductQuantity: (details) => {
    const count = parseInt(details.count);
    console.log(count)
    return new Promise((resolve, reject) => {
      if(details.count==-1 && details.quantity==0){
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(details.cart)},
        {
          $pull:{products:{item:ObjectId(details.product)}}
        }).then((response)=>{
          resolve({cartProductRemoved:true})
        })

      }else{
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
          {
            $inc: { 'products.$.quantity':count },
          }
        )
        .then((response) => {
          resolve({status:true});
        })
      }
    });
  
  },
  userVerified: (searchTerm) => {
    console.log("verifying");
    return new Promise(async (resolve, reject) => {
      try {
        console.log(searchTerm);
        const userCollection = db.get().collection(collection.USER_COLLECTION);
        const user = await userCollection.findOne({ _id: ObjectId(searchTerm) });
  
        if (user) {
          await userCollection.updateOne(
            { _id: user._id },
            { $set: { isVerified: true } }
          );
  
          console.log('User verified:', user);
          resolve(user);
        } else {
          console.log('User not found');
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  
  
  isVerified:(searchTerm) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(searchTerm);
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: searchTerm });
  
        if (user && user.isVerified) {
          console.log('User is verified:', user);
          resolve(true);
        } else {
          console.log('User is not verified');
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  ,  
  isPhoneVerified:(searchTerm) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(searchTerm);
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: searchTerm });
  
        if (user && user.isVerified) {
          console.log('User is verified:', user);
          resolve(user);
        } else {
          console.log('User is not verified');
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  ,
  isuserVerified:(searchTerm) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(searchTerm);
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({  phonenumber: searchTerm });
  
        if (user && user.isVerified) {
          console.log('User is verified:', user);
          resolve(true);
        } else {
          console.log('User is not verified');
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const total = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: ObjectId(userId) },
            },
            {
              $unwind: '$products',
            },
            {
              $project: {
                item: '$products.item',
                quantity: '$products.quantity',
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: 'item',
                foreignField: '_id',
                as: 'product',
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ['$product', 0] },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: { $multiply: ['$quantity', '$product.productPrice'] } },
              },
            },
          ])
          .toArray();
          
        if (total.length > 0) {
          resolve(total[0].total.toFixed(2));
        } else {
          resolve(0);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  
  
  getEachTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const eachTotal = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: ObjectId(userId) },
            },
            {
              $unwind: '$products',
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: 'products.item',
                foreignField: '_id',
                as: 'product',
              },
            },
            {
              $project: {
                productId: { $arrayElemAt: ['$product._id', 0] }, // Update to get the first element of the product._id array
                total: { $multiply: ['$products.quantity', { $arrayElemAt: ['$product.productPrice', 0] }] }, // Update to get the first element of the product.productPrice array
              },
            },
            {
              $project: {
                _id: 0, // Exclude the _id field
                productId: 1,
                total: 1,
              },
            },
          ])
          .toArray();
  
        resolve(eachTotal);
      } catch (error) {
        reject(error);
      }
    });
}


  ,
  
  
  deleteProductFromCart:(productDetails)=>{

    return new Promise((resolve,reject)=>{

        db.get().collection(collection.CART_COLLECTION)
        .updateOne(
            {

              _id: ObjectId(productDetails.cart),
            
            },
            {
            
                $pull: { products:{item:ObjectId(productDetails.product)} }, // Remove the product from user Cart
            
            }
            ).then((data)=>{

                // console.log(data);

                resolve({cartProductRemoved:true});
                // Send a status to Ajax call as boolean inside aobject, for indicating the product removal 

            }).catch((err)=>{

                if(err){

                    console.log(err);

                    reject(err);
                    
                }

            }
        );

    })

},

placeOrder: (order, products, total) => {
  return new Promise((resolve, reject) => {
    let status = order['payment-method'] === 'COD' ? 'placed' : 'pending';
    {
      let currentDate = new Date();
      let day = currentDate.getDate();
      let month = currentDate.getMonth() + 1; // Adding 1 because months are zero-based (0 for January)
      let year = currentDate.getFullYear();

      let orderObj = {
        address: {
          mobile: order.phonenumber,
          address1: order.add1,
          address2: order.add2,
          city: order.city,
          pincode: order.pincode
        },
        userName:order.firstname+""+order.lastname,
        userId: ObjectId(order.userId),
        paymentMethod: order['payment-method'],
        products: products,
        totalAmound: total,
        status: status,
        OrderStatus: 'pending',
        date: `${day}/${month}/${year}` // Assigning date as day/month/year string
      };
      
      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj)
        .then((response) => {
          db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) });
          resolve(response);
        });
    }
  });
}

  ,
  getcartProductList:(userId)=>{
    return new Promise( async (resolve,reject) =>{
      let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
      resolve(cart.products)
    })

  }
  ,

  getOrderList:(userId)=>{
    return new Promise( async (resolve,reject) =>{
      let orderdetails=await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).sort({ date:1 }).toArray()
      resolve(orderdetails)
    })

  },


  cancelOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            { $set: {OrderStatus: 'cancelled' } }
          );
        resolve({ordercancelled:true});
      } catch (error) {
        reject(error);
      }
    });
  },
  addUserDetails: (userId, userDetails) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.USER_COLLECTION).updateOne(
          { _id: ObjectId(userId) },
          { $set: userDetails } // Set the userDetails object
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  generateRazorpay:(orderId,total)=>{
   total=parseInt(total)
return new Promise((resolve,reject)=>{
  var options = {
    amount:total*100,  // amount in the smallest currency unit
    currency: "INR",
    receipt:""+orderId
  };
  instance.orders.create(options, function(err, order) {
   if(err){
    console.log(err);
   }else{
    console.log("New Order:",order);
    resolve(order)
   }
   
  });
})
  }
  ,
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto =require('crypto');
      let hmac = crypto.createHmac('sha256','4iUcWrjuqM0RKejSrKHisBif');
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
      hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })

  },
  changePaymentStatus:(orderId)=>{
    console.log(orderId);
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{
        $set:{
          status:'payed'
        }
      }).then(()=>{
        resolve()
      })
    })
  }
};
