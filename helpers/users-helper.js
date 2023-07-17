const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { promises } = require('nodemailer/lib/xoauth2');
const Promise = require('promise');
const Razorpay = require('razorpay');
const moment = require('moment');
const fs = require('fs');
var instance = new Razorpay({
  key_id: 'rzp_test_4VSqO0TCBFvtCE',
  key_secret: '4iUcWrjuqM0RKejSrKHisBif'
})
module.exports = {


  doSignup: (userData, referalCode, walletAmount) => {

    return new Promise(async (resolve, reject) => {

      try {

        userData.password = await bcrypt.hash(userData.password, 10);

        userData.referalCode = referalCode;

        userData.blocked = false;

        userData.isVerified = false;

        userData.walletAmount = parseInt(walletAmount);

        userData.token = '';

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

  getAllProductsForHome: (page, productPerPage, totalProducts) => {

    return new Promise(async (resolve, reject) => {

      try {

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

      } catch (error) {

        reject(error);

      }

    });

  }

  ,
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

              $lookup: {

                from: collection.PRODUCT_COLLECTION,

                localField: 'products.item',

                foreignField: '_id',

                as: 'product',

              },

            },

            {

              $unwind: '$product',

            },
            {

              $lookup: {

                from: collection.CATEGORY_COLLECTION,

                localField: 'product.productCategory',

                foreignField: '_id',

                as: 'category',

              },

            },

            {

              $unwind: '$category',

            },

            {

              $addFields: {

                productOffer: '$product.productOffer',

                categoryOffer: '$category.categoryOffer',

              },

            },

            {

              $addFields: {

                appliedOffer: {

                  $cond: {

                    if: { $gt: ['$productOffer', '$categoryOffer'] },

                    then: 'Product Offer',

                    else: 'Category Offer',

                  },

                },
                appliedOfferValue: {

                  $cond: {

                    if: { $gt: ['$productOffer', '$categoryOffer'] },

                    then: '$productOffer',

                    else: '$categoryOffer',

                  },

                },

              },

            },
            {
              $project: {

                item: '$products.item',

                quantity: '$products.quantity',

                product: 1,

                appliedOffer: 1,

                appliedOfferValue: 1,
              },
            },
          ])
          .toArray();

        resolve(cartItems);
      } catch (error) {
        reject(error);
      }
    });
  }
  ,

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
        }
        else {

          resolve([]);

        }
      }
      catch (error) {

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

        resolve(user);

      } catch (error) {

        reject(error);

      }

    });

  },

  isReferalExist: (referalCode) => {

    return new Promise(async (resolve, reject) => {

      try {

        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ referalCode: referalCode });

        if (user) {

          resolve(user._id);

        } else {

          resolve(false);

        }


      } catch (error) {

        reject(error);

      }

    });

  },

  isemailExists: (searchterm) => {

    return new Promise(async (resolve, reject) => {

      try {

        const email = await db.get().collection(collection.USER_COLLECTION).findOne({ email: searchterm });

        if (email) {

          resolve(email);

        } else {

          resolve(false);

        }

      } catch (error) {

        reject(error);

      }

    });

  },

  isTokenExist: (token) => {

    return new Promise(async (resolve, reject) => {

      try {

        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ token: token });

        if (user) {

          resolve(user);

        } else {

          resolve(false);

        }


      } catch (error) {

        reject(error);

      }

    });

  },

  updateWallet: (userId, referalAmound) => {


    return new Promise(async (resolve, reject) => {

      try {

        const user = await db

          .get()

          .collection(collection.USER_COLLECTION)

          .findOne({ _id: ObjectId(userId) });

        if (user) {

          const currentAmount = user.walletAmount;

          const updatedAmount = currentAmount + referalAmound;

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

  editProfile: (userId, details) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {

          $set: {

            name: details.name,

            phonenumber: details.phonenumber,

            email: details.email

          }

        });

        resolve();

      } catch (error) {

        reject(error);

      }

    });

  },

  changeProductQuantity: (details) => {

    const count = parseInt(details.count);

    return new Promise((resolve, reject) => {

      try {

        if (details.count == -1 && details.quantity == 0) {

          db.get()

            .collection(collection.CART_COLLECTION)

            .updateOne(

              { _id: ObjectId(details.cart) },

              {

                $pull: { products: { item: ObjectId(details.product) } },

              }

            )

            .then((response) => {

              resolve({ cartProductRemoved: true });

            });

        } else {

          db.get()

            .collection(collection.CART_COLLECTION)

            .updateOne(

              { _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },

              {

                $inc: { 'products.$.quantity': count },

              }

            )

            .then((response) => {

              resolve({ status: true });

            });

        }

      } catch (error) {

        reject(error);

      }

    });

  }

  ,

  userVerified: (searchTerm) => {

    return new Promise(async (resolve, reject) => {

      try {

        const userCollection = db.get().collection(collection.USER_COLLECTION);

        const user = await userCollection.findOne({ _id: ObjectId(searchTerm) });

        if (user) {

          await userCollection.updateOne(

            { _id: user._id },

            { $set: { isVerified: true } }

          );

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

  addUserImage: (userId, image) => {

    return new Promise(async (resolve, reject) => {

      try {

        const userCollection = db.get().collection(collection.USER_COLLECTION);
        const user = await userCollection.findOne({ _id: ObjectId(userId) });

        if (!user.image) {

          await userCollection.updateOne(

            { _id: ObjectId(userId) }, // Filter criteria to find the user

            { $set: { image: image } } // Update the image field with the new value

          );

          resolve();

        } else {

          await userCollection.updateOne(

            { _id: ObjectId(userId) }, // Filter criteria to find the user

            { $set: { image: image } } // Update the image field with the new value

          );

          let imagePath = './public/images/' + user.image;

          fs.unlink(imagePath, (err) => {

            if (err) {

              console.log(err);

            } else {

              console.log('Image deleted successfully ');

            }

          });

          resolve();

        }

      } catch (error) {

        reject(error);

      }

    });

  }
  ,

  isVerified: (searchTerm) => {

    return new Promise(async (resolve, reject) => {

      try {

        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: searchTerm });

        if (user && user.isVerified) {

          resolve(true);

        } else {

          resolve(null);

        }

      } catch (error) {

        reject(error);

      }

    });

  }

  ,
  isPhoneVerified: (searchTerm) => {

    return new Promise(async (resolve, reject) => {

      try {

        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: searchTerm });

        if (user && user.isVerified) {

          resolve(user);

        } else {

          resolve(null);
        }
      } catch (error) {

        reject(error);

      }

    });

  }

  ,

  isuserVerified: (searchTerm) => {

    return new Promise(async (resolve, reject) => {

      try {

        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: searchTerm });

        if (user && user.isVerified) {

          resolve(true);
        } else {

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

              $lookup: {

                from: collection.CATEGORY_COLLECTION,

                localField: 'product.productCategory',

                foreignField: '_id',

                as: 'category',

              },

            },

            {

              $addFields: {

                category: { $arrayElemAt: ['$category', 0] },

              },

            },

            {

              $addFields: {

                finalPrice: {

                  $cond: {

                    if: { $gt: ['$product.productOffer', '$category.categoryOffer'] },

                    then: '$product.offerPrice',

                    else: {

                      $multiply: [

                        '$product.productPrice',

                        { $subtract: [1, { $divide: ['$category.categoryOffer', 100] }] },

                      ],

                    },

                  },

                },

              },

            },


            {

              $group: {

                _id: null,

                total: {

                  $sum: { $multiply: ['$products.quantity', '$finalPrice'] },

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

  deleteProductFromCart: (productDetails) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.CART_COLLECTION)

          .updateOne(

            {

              _id: ObjectId(productDetails.cart),

            },

            {

              $pull: { products: { item: ObjectId(productDetails.product) } },

            }

          )

          .then((data) => {

            resolve({ cartProductRemoved: true });

          })

          .catch((err) => {

            if (err) {

              console.log(err);

              reject(err);

            }

          });

      } catch (error) {

        reject(error);

      }

    });

  },

  placeOrder: (order, products, total, userId) => {

    return new Promise((resolve, reject) => {

      try {


        let status = order['payment-method'] === 'COD' ? 'placed' : 'pending';

        let currentDate = moment().format('DD/MM/YYYY HH:mm:ss');

        let orderObj = {

          address: {

            phone1: order.phoneNumber,

            phone2: order.phoneNumber2,

            address1: order.address,

            city: order.city,

            pincode: order.pincode,

            state: order.state,

          },

          userName: order.fullname,

          userId: ObjectId(userId),

          paymentMethod: order['payment-method'],

          products: products,

          totalAmound: parseInt(total),

          status: status,

          OrderStatus: 'pending',

          date: currentDate,
        };


        db.get()

          .collection(collection.ORDER_COLLECTION)

          .insertOne(orderObj)

          .then((response) => {

            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) });

            resolve(response);

          })

          .catch((error) => {

            reject(error);

          });

      } catch (error) {

        reject(error);

      }

    });

  },

  getcartProductList: (userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) });

        resolve(cart.products);

      } catch (error) {

        reject(error);

      }

    });

  },

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

            { $set: { OrderStatus: 'cancelrequest' } }

          );

        resolve({ cancelrequest: true });

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

            { $set: { OrderStatus: 'returnrequest' } }

          );

        resolve({ returnrequest: true });

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

        // Check if the user already has a primary address
        const user = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ userId });

        const hasPrimaryAddress = user && user.addresses.some(address => address.primary);

        // Set the primary flag of the new address
        const address = { _id: addressId, ...userDetails };

        if (!hasPrimaryAddress) {

          address.primary = true;

        }


        await db

          .get()

          .collection(collection.ADDRESS_COLLECTION)

          .updateOne(

            { userId: userId }, // Filter by user ID

            { $push: { addresses: address } }, // Push the address with the assigned ID into the addresses array

            { upsert: true } // Create a new document if it doesn't exist

          );



        resolve();

      } catch (error) {

        reject(error);

      }

    });

  }
  ,

  makePrimaryAddress: (userId, addressId) => {

    return new Promise((resolve, reject) => {

      // Set all addresses as primary=false

      db.get().collection(collection.ADDRESS_COLLECTION).updateMany(

        { userId: userId },

        { $set: { "addresses.$[].primary": false } }

      ).then(() => {
        // Set the specified addressId as primary=true

        db.get().collection(collection.ADDRESS_COLLECTION).updateOne(

          { userId: userId, "addresses._id": ObjectId(addressId) },

          { $set: { "addresses.$.primary": true } }

        ).then(() => {

          resolve();

        }).catch((err) => {

          reject(err);

        });

      }).catch((err) => {

        reject(err);

      });

    });

  }
  ,

  generateRazorpay: (orderId, total) => {

    total = parseInt(total);

    return new Promise((resolve, reject) => {

      try {

        var options = {

          amount: total * 100,  // amount in the smallest currency unit

          currency: "INR",

          receipt: "" + orderId

        };

        instance.orders.create(options, function (err, order) {

          if (err) {

            console.log(err);

            reject(err);

          } else {

            resolve(order);

          }

        });

      } catch (error) {

        reject(error);

      }

    });

  },

  verifyPayment: (details) => {

    return new Promise((resolve, reject) => {

      try {

        const crypto = require('crypto');

        let hmac = crypto.createHmac('sha256', '4iUcWrjuqM0RKejSrKHisBif');

        hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);

        hmac = hmac.digest('hex');
        if (hmac == details['payment[razorpay_signature]']) {

          resolve();

        } else {

          reject();

        }

      } catch (error) {

        reject(error);

      }

    });

  },

  changePaymentStatus: (orderId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get().collection(collection.ORDER_COLLECTION).updateOne(

          { _id: ObjectId(orderId) },

          { $set: { status: 'payed' } }

        ).then(() => {

          resolve();

        });

      } catch (error) {

        reject(error);

      }

    });

  },

  searchProducts: (searchQuery) => {

    return new Promise(async (resolve, reject) => {

      try {

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

      } catch (error) {

        reject(error);

      }

    });

  },

  getTotalProductCount: () => {

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
  getCategoryByName: (category) => {

    return new Promise(async (resolve, reject) => {

      try {

        const cid = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryName: category });

        resolve(cid);

      } catch (error) {

        reject(error);

      }

    });

  }

  ,
  getProductById: (proId) => {

    return new Promise(async (resolve, reject) => {

      try {

        const product= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id:ObjectId(proId)});

        const quantity=product.productQuantity

        resolve(quantity);

      } catch (error) {

        reject(error);

      }

    });

  },

  listCategorys: (catId) => {

    return new Promise(async (resolve, reject) => {

      try {

        const categoryProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: catId }).toArray();



        resolve(categoryProducts);
      }
      catch (error) {

        reject(error);

      }

    });

  },
  couponExist: (coupon) => {

    return new Promise(async (resolve, reject) => {

      try {

        const exists = await db

          .get()

          .collection(collection.COUPON_COLLECTION)

          .findOne({ couponcode: coupon });

        if (exists) {

          resolve(exists)

        } else {

          resolve(false)

        }



      } catch (error) {

        reject(error);

      }

    });

  },

  getOrder: (userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        const order = await db

          .get()

          .collection(collection.ORDER_COLLECTION)

          .findOne({ userId: ObjectId(userId) });

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

  addDiscountedTotal: (userId, discountedTotal, total) => {

    return new Promise(async (resolve, reject) => {

      try {

        let updated = await db

          .get()

          .collection(collection.CART_COLLECTION)

          .updateOne(

            { user: ObjectId(userId) },

            {


              $set: {

                discountedAmount: discountedTotal,

                checkCartTotal: total

              }

            }

          );
        resolve(updated);

      } catch (error) {

        reject(error);

      }

    });

  },

  addDiscountedTotalChange: (userId, discountedTotal) => {

    return new Promise(async (resolve, reject) => {


      try {

        await db

          .get()

          .collection(collection.CART_COLLECTION)

          .updateOne(

            { user: ObjectId(userId) },

            {

              $set: {

                discountedAmount: discountedTotal

              }

            }

          );

        resolve();

      } catch (error) {

        reject(error);

      }

    });

  },

  checkCartTotalChange: (userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db

          .get()

          .collection(collection.CART_COLLECTION)

          .updateOne(

            { user: ObjectId(userId) },

            {

              $set: {

                checkCartTotal: 0

              }

            }
          );

        resolve();

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

  getCheckCartTotal: (userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        let cart = await db

          .get()

          .collection(collection.CART_COLLECTION)

          .findOne({ user: ObjectId(userId) }, { checkCartTotal: 1 });


        if (cart) {

          resolve(cart.checkCartTotal);

        } else {

          resolve(null);

        }

      } catch (error) {

        reject(error);

      }

    });

  }
  ,



  addToUsedCoupon: (userId, couponCode) => {

    return new Promise(async (resolve, reject) => {

      try {

        const coupon = {

          couponCode: couponCode,

          status: 'applied'

        };


        const existingCoupon = await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({

          user: ObjectId(userId),

          'coupons.couponCode': couponCode

        });

        if (existingCoupon) {

          // Update the status of the existing coupon

          await db.get().collection(collection.USED_COUPON_COLLECTION).updateOne(
            {

              user: ObjectId(userId),

              'coupons.couponCode': couponCode

            },

            { $set: { 'coupons.$.status': 'applied' } }

          );


        } else {

          // Create a new array element

          await db.get().collection(collection.USED_COUPON_COLLECTION).updateOne(

            { user: ObjectId(userId) },

            { $push: { coupons: coupon } },

            { upsert: true }
          );

        }

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

        if (usedCoupon) {

          resolve(false); // Coupon is already used

        } else {

          resolve(true); // Coupon is not used

        }
      }
      catch (error) {

        reject(error);

      }
    })
      ;
  }

  ,
  
  isAlreadyUsedCoupon: (userId, couponCode) => {


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

        if (usedCoupon) {

          resolve(true); // Coupon is already used

        } else {

          resolve(false); // Coupon is not used

        }
      }
      catch (error) {

        reject(error);

      }
    })
      ;
  }

  ,
  isChanged: (userId, couponCode) => {

    return new Promise(async (resolve, reject) => {

      try {

        const Coupon = await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({

          user: ObjectId(userId),

          coupons: {

            $elemMatch: {

              couponCode: couponCode,

              status: ''

            }

          }

        });


        if (Coupon) {

          resolve(true); // Coupon is already used

        } else {

          resolve(false); // Coupon is not used

        }

      } catch (error) {

        reject(error);

      }

    });

  }
  ,
  updateCouponStatus: (userId, couponCode) => {


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

      try {

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

      } catch (error) {

        reject(error);

      }

    });

  },

  removeAddress: (addressId, userId) => {

    return new Promise((resolve, reject) => {

      try {

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

      } catch (error) {

        reject(error);

      }

    });

  },

  getUser: (userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });


        resolve(user);
      }
      catch (error) {

        reject(error);
      }
    });
  },
  getCoupons: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const currentDate = new Date();
  
        const coupons = await db.get().collection(collection.COUPON_COLLECTION).find({
          removed: false,
          expiryDate: { $gt: currentDate }
        }).toArray();
  
        resolve(coupons);
      } catch (error) {
        reject(error);
      }
    });
  },
  

  deductAmountFromWallet: (userId, amount) => {

    return new Promise((resolve, reject) => {

      try {

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

      } catch (error) {

        reject(error);

      }

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
  passwordMatch: (currentPassword, userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });

        if (user) {

          const status = await bcrypt.compare(currentPassword, user.password);

          if (status) {

            resolve(true);

          } else {

            resolve(false);

          }

        } else {

          resolve(false);

        }

      } catch (error) {

        reject(error);
      }

    });

  }
  ,
  changePassword: (newpassword, userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db.get().collection(collection.USER_COLLECTION).updateOne(

          { _id: ObjectId(userId) },

          { $set: { password: await bcrypt.hash(newpassword, 10) } }
        );

        resolve(true);

      } catch (error) {

        reject(error);

      }

    });

  },

  changeForgotPassword: (newpassword, email) => {

    return new Promise(async (resolve, reject) => {

      try {

        const response = await db.get().collection(collection.USER_COLLECTION).updateOne(

          { email: email },

          { $set: { password: await bcrypt.hash(newpassword, 10) } }

        );

        resolve(true);

      } catch (error) {

        reject(error);

      }

    });

  },

  addToken: (email, randomString) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db

          .get()

          .collection(collection.USER_COLLECTION)

          .updateOne(

            { email: email },

            { $set: { token: randomString } }

          );

        resolve({ cancelrequest: true });

      } catch (error) {

        reject(error);

      }

    });

  },

  changeCouponStatus: (userId, couponCode) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db.get().collection(collection.USED_COUPON_COLLECTION).updateOne(

          { user: ObjectId(userId), 'coupons.couponCode': couponCode },

          { $set: { 'coupons.$.status': '' } }

        );

        resolve();

      } catch (error) {

        reject(error);

      }

    });

  },
  checkCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) });
        if (userCart) {
          const proExist = userCart.products.find((product) => product.item.toString() === proId);
          if (proExist) {
            resolve({ exists: true });
          } else {
            resolve({ exists: false });
          }
        } else {
          resolve({ exists: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  generateRazorpayForWallet: (user, total) => {


    total = parseInt(total);

    return new Promise((resolve, reject) => {

      try {

        var options = {

          amount: total * 100,  // amount in the smallest currency unit

          currency: "INR",

          receipt: "" + user

        };

        instance.orders.create(options, function (err, order) {

          if (err) {

            console.log(err);

            reject(err);

          } else {

            resolve(order);

          }

        });

      } catch (error) {

        reject(error);

      }

    });

  },

  
  
};



