const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

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
      db.get()
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
          .find({ OrderStatus: { $ne: 'cancelled' } })
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

  changeStatusoOrder: (orderId, orderStatus) => {
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
  }

};



