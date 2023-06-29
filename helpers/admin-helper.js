const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { reject, resolve } = require('promise');

module.exports = {
  doLogin: async (adminData) => {
    try {
      const admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email });
      if (admin) {
        // Compare the provided password with the stored password
        const passwordMatch = await (adminData.password, admin.password);
        if (passwordMatch) {
          return {
            admin: admin,
            status: true,
          };
        } else {
          return { status: false };
        }
      } else {
        return { status: false };
      }
    } catch (error) {
      console.error('Error occurred during login:', error);
      throw error;
    }
  },
  getUserDetails: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const users = await db.get().collection(collection.USER_COLLECTION).find({ blocked: false }).toArray();
        resolve(users);
      } catch (error) {
        reject(error);
      }
    });
  },
  getBlockedUserDetails: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const blockedUsers = await db.get().collection(collection.USER_COLLECTION).find({ blocked: true }).toArray();
        resolve(blockedUsers);
      } catch (error) {
        reject(error);
      }
    });
  },
  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, { $set: { blocked: true } }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
  addOffer: (ctId,offer) => {
    return new Promise((resolve, reject) => {

      db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: ObjectId(ctId) }, { $set: { categoryOffer: offer } }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
  unblockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, { $set: { blocked: false } }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
  isBlocked: (useremail) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).findOne({ email: useremail }, (err, user) => {
        if (err) {
          reject(err);
        } else {
          if (user && user.blocked === true) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });
    });
  },
  isUserBlocked: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) }, (err, user) => {
        if (err) {
          reject(err);
        } else {
          if (user && user.blocked === true) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });
    });
  },
  userisSBlocked: (searchTerm) => {
    return new Promise(async (resolve, reject) => {
      try {
        searchTerm="+91"+searchTerm;
        console.log(searchTerm)
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: searchTerm });
        if (user && user.blocked === true) {
          resolve(true); // User is blocked
        } else {
          resolve(false); // User is not blocked
        }
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
  },
  removeCategory: (ctId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: ObjectId(ctId) });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  checkCategoryExists: (categoryName) => {
    return new Promise((resolve, reject) => {
         let category=db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ categoryName: categoryName })
        .then((category) => {
          if (category) {
            resolve(true); // Category exists
          } else {
            resolve(false); // Category does not exist
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  ,

  addCategory: (categoryData) => {
    categoryData.categoryOffer=0;
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(categoryData);
        }
      });
    });
  },
  getCategoryById: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectId(categoryId) }).then((category) => {
        resolve(category);
      }).catch((error) => {
        reject(error);
      });
    });
  },
  getOrderList: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find()
          .sort({ date: -1 }) // Sort by date in descending order (newest first)
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  ,
  getProductsInOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          { $match: { _id: ObjectId(orderId) } },
          { $unwind: '$products' },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'product'
            }
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ['$product', 0] }
            }
          }
        ]).toArray();

        console.log(orderItems);
        resolve(orderItems);
      } catch (error) {
        reject(error);
      }
    });
  }

  ,

  changeStatusOrder: (orderId, orderStatus) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.ORDER_COLLECTION).updateOne(
          { _id: ObjectId(orderId) },
          { $set: { OrderStatus: orderStatus } }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  addCoupon:(coupon)=>{
   return new Promise(async(resolve,reject)=>{
    try{


      await db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((coupon)=>{
        resolve(coupon)
      })
    }catch(err){
      console.log(err);
    }
   })
  },
  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const coupons = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .find({
            removed:false})
          .sort({ createdAt: -1 }) // Sort by descending order of createdAt field
          .toArray();
        resolve(coupons);
      } catch (error) {
        reject(error);
      }
    });
  },
  // adminHelper.js
  removeCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.COUPON_COLLECTION).updateOne(
          { _id: ObjectId(couponId) },
          { $set: { removed: true } }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  ,

couponExists:(coupon)=>{
  return new Promise(async (resolve, reject) => {
    try {
    
      const couponexists = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponcode: coupon });
      if (couponexists) {
        resolve(true); //coupon exists
      } else {
        resolve(false); //no coupon
      }
    } catch (error) {
      reject(error);
    }
  });
},
getTotalOrders: () => {
  return new Promise(async (resolve, reject) => {
    try {
      const count = await db.get().collection(collection.ORDER_COLLECTION).countDocuments();
      resolve(count);
    } catch (error) {
      reject(error);
    }
  });
},

getOrdersByPage: (page, perPage) => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ OrderStatus: { $ne: "cancelrequest" } })
        .sort({ date: -1 }) // Sort by date in descending order (newest first)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray();
      resolve(orders);
    } catch (error) {
      reject(error);
    }
  });
},

getCancelRequests: () => {
  return new Promise(async (resolve, reject) => {
    try {
      const cancelRequests = await db.get().collection(collection.ORDER_COLLECTION).find({ OrderStatus: "cancelrequest" }).toArray();
      console.log(cancelRequests)
      resolve(cancelRequests);
    } catch (error) {
      reject(error);
    }
  });
},
getReturnRequests: () => {
  return new Promise(async (resolve, reject) => {
    try {
      const cancelRequests = await db.get().collection(collection.ORDER_COLLECTION).find({ OrderStatus: "returnrequest" }).toArray();
      console.log(cancelRequests)
      resolve(cancelRequests);
    } catch (error) {
      reject(error);
    }
  });
},
getOrderStatus: (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) });
      if (order) {
        resolve(order.OrderStatus);
      } else {
        reject(new Error('Order not found'));
      }
    } catch (error) {
      reject(error);
    }
  });
},
getOrder:(orderId)=>{
  return new Promise((resolve, reject) => {
    db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) }).then((order) => {
      resolve(order);
    }).catch((error) => {
      reject(error);
    });
  });
},
updateWallet: (userId,totalAmound) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      
      if (user) {
        const currentAmount = user.walletAmount;
        const updatedAmount = currentAmount + totalAmound;
        
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: ObjectId(userId) },
            { $set: { walletAmount: updatedAmount } }
          );
        
        resolve();
      } else {
        reject(new Error('User not found'));
      }
    } catch (error) {
      reject(error);
    }
  });
},

};



