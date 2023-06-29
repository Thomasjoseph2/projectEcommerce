const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { response } = require('../app');
const { promises } = require('nodemailer/lib/xoauth2');
const { resolve } = require('promise');
const Razorpay = require('razorpay');
const moment = require('moment');
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
        userData.walletAmount=0;
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
  getAllProductsForHome: (page, productPerPage,totalProducts) => {
    return new Promise(async (resolve, reject) => {
      const productCollection = db.get().collection(collection.PRODUCT_COLLECTION);
      const totalPages = Math.ceil(totalProducts / productPerPage);
  
      productCollection
        .find()
        .skip((page - 1) * productPerPage)
        .limit(productPerPage)
        .toArray((err, products) => {
          if (err) {
            reject(err);
          } else {
            resolve({ products, totalPages });
          }
        });
    });
  },
  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await db
          .get()
          .collection(collection.ADDRESS_COLLECTION)
          .aggregate([
            { $match: { userId: userId } },
            { $unwind: "$addresses" },
          ])
          .toArray();
          
        // Extract the addresses array from the result
        let addresses = result.map(item => item.addresses);
        
        resolve(addresses);
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
  addToWishList: (proId, userId) => {
    const proObj = {
      item: ObjectId(proId),
    };
    return new Promise(async (resolve, reject) => {
      try {
        const userWishlist = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({ user: ObjectId(userId) });
  
        if (userWishlist) {
          const proExist = userWishlist.products.find(
            (product) => product.item.toString() === proId
          );
  
          if (proExist) {
            // Product already exists in the wishlist
            resolve();
          } else {
            await db
              .get()
              .collection(collection.WISHLIST_COLLECTION)
              .updateOne(
                { user: ObjectId(userId) },
                {
                  $push: { products: proObj },
                }
              );
            resolve();
          }
        } else {
          const wishlistObj = {
            user: ObjectId(userId),
            products: [proObj],
          };
  
          const response = await db
            .get()
            .collection(collection.WISHLIST_COLLECTION)
            .insertOne(wishlistObj);
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
  wishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const wishlist = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({ user: ObjectId(userId) });
  
        if (wishlist) {
          const wishlistProducts = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .aggregate([
              {
                $match: { _id: { $in: wishlist.products.map((product) => product.item) } },
              },
            ])
            .toArray();
  
          resolve(wishlistProducts);
        } else {
          resolve([]);
        }
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
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: 'products.item',
                foreignField: '_id',
                as: 'product',
              },
            },
            {
              $addFields: {
                product: { $arrayElemAt: ['$product', 0] },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: { $multiply: ['$products.quantity', '$product.offerPrice'] },
                },
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
  }
  ,
  
  
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
    let currentDate = moment().format('DD/MM/YYYY HH:mm:ss');

    let orderObj = {
      address: {
        mobile: order.phonenumber,
        address1: order.address,
        city: order.city,
        pincode: order.pincode
      },
      userName: order.firstname + ' ' + order.lastname,
      userId: ObjectId(order.userId),
      paymentMethod: order['payment-method'],
      products: products,
      totalAmound: parseInt(total),
      status: status,
      OrderStatus: 'pending',
      date: currentDate
    };

    db.get()
      .collection(collection.ORDER_COLLECTION)
      .insertOne(orderObj)
      .then((response) => {
        db.get()
          .collection(collection.CART_COLLECTION)
          .deleteOne({ user: ObjectId(order.userId) });
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
},
walletPayment:(order,total)=>{
   
}
  ,
  getcartProductList:(userId)=>{
    return new Promise( async (resolve,reject) =>{
      let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
      resolve(cart.products)
    })

  }
  ,

  getOrderList: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orderdetails = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ userId: ObjectId(userId) })
          .sort({ date: -1 }) // Sort by date in descending order (newest first)
          .toArray();
        resolve(orderdetails);
      } catch (error) {
        reject(error);
      }
    });
  },


  cancelOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            { $set: {OrderStatus: 'cancelrequest' } }
          );
        resolve({cancelrequest:true});
      } catch (error) {
        reject(error);
      }
    });
  },
  returnOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            { $set: {OrderStatus: 'returnrequest' } }
          );
        resolve({returnrequest:true}); 
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
          { $set: userDetails } 
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  adduserAddress: (userId, userDetails) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate a new ObjectId for the address
        const addressId = new ObjectId();
  
        await db
          .get()
          .collection(collection.ADDRESS_COLLECTION)
          .updateOne(
            { userId: userId }, // Filter by user ID
            { $push: { addresses: { _id: addressId, ...userDetails } } }, // Push the address with the assigned ID into the addresses array
            { upsert: true } // Create a new document if it doesn't exist
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
  ,searchProducts: (searchQuery) => {
    return new Promise(async (resolve, reject) => {
      const categoryQuery = { categoryName: { $regex: searchQuery, $options: 'i' } };
      const category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne(categoryQuery);
  
      let productQuery = {};
      if (category) {
        productQuery = {
          $or: [
            { productName: { $regex: searchQuery, $options: 'i' } },
            { productCategory: category._id }
          ]
        };
      } else {
        productQuery = { productName: { $regex: searchQuery, $options: 'i' } };
      }
  
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find(productQuery)
        .toArray();
  
      resolve(products);
    });
  },getTotalProductCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const count = await db.get().collection(collection.PRODUCT_COLLECTION).countDocuments();
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
  },

  getPaginatedProducts: (perPage, currentPage) => {
    return new Promise(async (resolve, reject) => {
      try {
        const products = await db.get().collection(collection.PRODUCT_COLLECTION)
          .find()
          .skip((currentPage - 1) * perPage)
          .limit(perPage)
          .toArray();
        resolve(products);
      } catch (error) {
        reject(error);
      }
    });
  },
  getCategory: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
        resolve(categories);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  ,
  getCategoryByName:(category)=>{
    return new Promise(async (resolve, reject) => {
      try {
        const cid = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({categoryName:category });
        resolve(cid);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  ,
  listCategorys:(catId)=>{
    return new Promise(async (resolve, reject) => {
      try {
        const categoryProducts= await db.get().collection(collection.PRODUCT_COLLECTION).find({productCategory:catId }).toArray();
        
        resolve(categoryProducts);
      } catch (error) {
        reject(error);
      }
    });
  },
  couponExist: (coupon) => {
console.log(coupon)

    return new Promise(async (resolve, reject) => {
      try {
        const exists = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .findOne({ couponcode: coupon });
          if(exists){
            resolve(exists)
          }else{
            resolve(false)
          }
         
          

      } catch (error) {
        reject(error);
      }
    });
  },
  getOrder:(userId)=>{
    return new Promise(async (resolve, reject) => {
      try {
        const order= await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .findOne({ userId: ObjectId(userId)});
           resolve(order)    

      } catch (error) {
        reject(error);
      }
    });
  },
  // updateOrder:(orderId,discountedTotal)=>{
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //     let updated=  await db
  //       .get()
  //       .collection(collection.ORDER_COLLECTION)
  //       .updateOne(
  //         { _id: orderId},
  //         { $set: { totalAmound: discountedTotal.toFixed(2) } }
  //       );  
  //       resolve(updated)
  //     } catch (error) {
  //       reject(error);
  //     }
  //   });
  // },
  addDiscountedTotal: (userId, discountedTotal) => {
    return new Promise(async (resolve, reject) => {
      try {
        let updated = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { user: ObjectId(userId) },
            { $set: { discountedAmount: discountedTotal } }
          );
        resolve(updated);
      } catch (error) {
        reject(error);
      }
    });
  },
  getDiscountedAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: ObjectId(userId) }, { discountedAmount: 1 });
  
        if (cart) {
          resolve(cart.discountedAmount);
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  ,
  addToUsedCoupon:(userId,couponcode)=>{

  },
  addToUsedCoupon: (userId, couponCode) => {
  return new Promise(async (resolve, reject) => {
    try {
      const coupon = {
        couponCode: couponCode,
        status: 'applied'
      };

      await db.get().collection(collection.USED_COUPON_COLLECTION).updateOne(
        { user: ObjectId(userId) },
        { $push: { coupons: coupon } },
        { upsert: true }
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
  ,
  isAlreadyUsed: (userId, couponCode) => {
    return new Promise(async (resolve, reject) => {
      try {
        const usedCoupon = await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({
          user: ObjectId(userId),
          coupons: {
            $elemMatch: {
              couponCode: couponCode,
              status: "used"
            }
          }
        });
        console.log(usedCoupon,"couponused")
        if (usedCoupon) {
          resolve(false); // Coupon is already used
        } else {
          resolve(true); // Coupon is not used
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  ,
  updateCouponStatus: (userId, couponCode) => {
    //console.log(userId,couponCode);
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.USED_COUPON_COLLECTION).updateOne(
          { user: ObjectId(userId), 'coupons.couponCode': couponCode },
          { $set: { 'coupons.$.status': 'used' } }
        );
  
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
,
removeItemFromWishlist: (proId, userId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.WISHLIST_COLLECTION)
      .updateOne(
        {
          user: ObjectId(userId),
        },
        {
          $pull: { products: { item: ObjectId(proId) } },
        }
      )
      .then((data) => {
        resolve({ wishlistProductRemoved: true });
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
},
removeAddress: (addressId, userId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .updateOne(
        { userId: userId },
        { $pull: { addresses: { _id: ObjectId(addressId) } } }
      )
      .then((data) => {
        resolve({ addressRemoved: true });
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
},

 getUser: (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id:ObjectId(userId) });
      console.log(user);
      resolve(user);
    } catch (error) {
      reject(error);
    }
  });
},
deductAmountFromWallet: (userId, amount) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { _id: ObjectId(userId) },
        { $inc: { walletAmount: -parseInt(amount) } }
      )
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
},
updateOrderStatus: (orderId, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      const orderCollection = db.get().collection(collection.ORDER_COLLECTION);
      const response = await orderCollection.updateOne(
        { _id: ObjectId(orderId) },
        { $set: { status: status } }
      );
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
},
updateStatus: (orderId, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      const orderCollection = db.get().collection(collection.ORDER_COLLECTION);
      const response = await orderCollection.updateOne(
        { _id: ObjectId(orderId) },
        { $set: { OrderStatus: status } }
      );
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
},

};


