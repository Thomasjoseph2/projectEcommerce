const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { promises } = require('nodemailer/lib/xoauth2');
const Promise = require('promise');
const Razorpay = require('razorpay');
const moment = require('moment');
require('dotenv').config()
const fs = require('fs');
var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECREAT
})


module.exports = {

// doSignup:
// This function registers a new user.
// It takes the user's data, hash their password,
// and insert the user into the database.
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
// doLogin:
// This function logs in a user.
// It takes the user's email and password,
// and compares the password with the hash stored in the database.
// If the passwords match, the function returns the user object.


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

  // getAllProductsForHome:
// This function gets all products for the home page.
// It takes the page number, products per page,
// total filtered products, filter options, and sort options.
// It applies the filters and sorts the products,
// and then returns the products and the total pages

  getAllProductsForHome: (page, productPerPage, totalFilteredProducts, filterOptions, sortOptions) => {
    return new Promise(async (resolve, reject) => {
      try {
        const productCollection = db.get().collection(collection.PRODUCT_COLLECTION);
        const totalPages = Math.ceil(totalFilteredProducts / productPerPage);
  
        // Apply filters
        let query = {};
        if (filterOptions.category) {
          query.productCategory = ObjectId(filterOptions.category);
        }
        // Add more filters if needed
  
        // Apply sorting
        let sortQuery = {};
        if (sortOptions) {
          sortQuery[sortOptions.sortBy] = sortOptions.sortOrder === 'asc' ? 1 : -1;
        }
  
        productCollection
          .find(query)
          .sort(sortQuery)
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
  },
// getTotalFilteredProductCount:
// This function gets the total filtered product count.
// It takes the filter options,
// and applies the filters to the product collection,
// and then returns the total number of products.
  getTotalFilteredProductCount: (filterOptions) => {
    return new Promise(async (resolve, reject) => {
      try {
        const productCollection = db.get().collection(collection.PRODUCT_COLLECTION);

        // Apply filters
        let query = {};
        if (filterOptions.category) {
          query.productCategory = ObjectId(filterOptions.category);
        }
        // Add more filters if needed

        const totalFilteredProducts = await productCollection.countDocuments(query);
        resolve(totalFilteredProducts);
      } catch (error) {
        reject(error);
      }
    });
  },  
  // getUserAddress:
// This function gets the user's addresses.
// It takes the user ID,
// and aggregates the address collection to get the user's addresses,
// and then returns the addresses.
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




// addToCart:
// This function adds a product to the user's cart.
// It takes the product ID and the user ID,
// and then updates the cart collection.
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

  // addToWishList:
// This function adds a product to the user's wishlist.
// It takes the product ID and the user ID,
// and then updates the wishlist collection.

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

  // getCartProducts:
// This function gets the products in the user's cart.
// It takes the user ID,
// and then aggregates the cart collection to get the products in the cart.
// It also gets the product offer and category offer for each product,
// and then calculates the applied offer and applied offer value.

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
// wishlistProducts:
// This function gets the products in the user's wishlist.
// It takes the user ID,
// and then aggregates the wishlist collection to get the products in the wishlist.

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
// getCartCount:
// This function gets the number of products in the user's cart.
// It takes the user ID,
// and then queries the cart collection to get the number of products.
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
// searchUser:
// This function searches for a user by phone number.
// It takes the phone number,
// and then queries the user collection to find the user.
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
// isReferalExist:
// This function checks if a referral code exists.
// It takes the referral code,
// and then queries the user collection to see if the referral code exists.
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
// isemailExists:
// This function checks if an email exists.
// It takes the email,
// and then queries the user collection to see if the email exists.
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
// isTokenExist:
// This function checks if a token exists.
// It takes the token,
// and then queries the user collection to see if the token exists.
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
  // updateWallet:
// This function updates the user's wallet amount.
// It takes the user ID and the referral amount,
// and then updates the wallet amount in the user collection

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
  // editProfile:
// This function edits the user's profile.
// It takes the user ID and the new profile details,
// and then updates the user collection.

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
// changeProductQuantity:
// This function changes the quantity of a product in the cart.
// It takes the cart ID, product ID, and new quantity,
// and then updates the cart collection.
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

  // userVerified:
// This function verifies a user.
// It takes the user ID,
// and then updates the user collection to mark the user as verified.

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
// addUserImage:
// This function adds a user's image to the database.
// It takes the user ID and the image,
// and then updates the user collection.
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
// isVerified:
// This function checks if a user is verified.
// It takes the user's email,
// and then queries the user collection to see if the user is verified.
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
  // isPhoneVerified:
// This function checks if a user is verified by phone number.
// It takes the user's phone number,
// and then queries the user collection to see if the user is verified by phone number.
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
// isuserVerified:
// This function checks if a user is verified by phone number or email.
// It takes the user's phone number or email,
// and then queries the user collection to see if the user is verified.
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
  // getCartTotal:
// This function gets the total amount of the products in the user's cart.
// It takes the user ID,
// and then aggregates the cart collection to get the total amount.
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
// getEachTotal:
// This function gets the total amount of each product in the user's cart.
// It takes the user ID,
// and then aggregates the cart collection to get the total amount for each product.

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
// deleteProductFromCart:
// This function deletes a product from the user's cart.
// It takes the product ID and the cart ID,
// and then updates the cart collection.
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
// placeOrder:
// This function places an order for the user.
// It takes the order details, products, total amount, and user ID,
// and then inserts a new order into the order collection.
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

          reason:''
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
// getcartProductList:
// This function gets the list of products in the user's cart.
// It takes the user ID,
// and then queries the cart collection to get the list of products.
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

// getOrderList:
// This function gets the list of orders for the user.
// It takes the user ID and filters,
// and then queries the order collection to get the list of orders.
  getOrderList: (userId, filters) => {

    return new Promise(async (resolve, reject) => {
    
      try {
    
        let query = { userId: ObjectId(userId) };
  
        if (filters.status) {
    
          query.OrderStatus = filters.status;
    
        }
  
        if (filters.paymentMethod) {
    
          query.paymentMethod = filters.paymentMethod;
    
        }
  
        let orderdetails = await db
    
        .get()
    
        .collection(collection.ORDER_COLLECTION)
    
        .find(query)
    
        .sort({ date: -1 })
    
        .toArray();
  
        resolve(orderdetails);
    
      } catch (error) {
    
        reject(error);
    
      }
    
    });
  
  },
  
  
// cancelOrder:
// This function cancels an order.
// It takes the order ID,
// and then updates the order collection to set the status to "cancelrequest".

  cancelOrder: (orderId,reason) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db

          .get()

          .collection(collection.ORDER_COLLECTION)

          .updateOne(

            { _id: ObjectId(orderId) },

            { $set: { OrderStatus: 'cancelrequest',reason:reason } }

          );

        resolve({ cancelrequest: true });

      } catch (error) {

        reject(error);

      }

    });

  },
  // returnOrder:
// This function returns an order.
// It takes the order ID,
// and then updates the order collection to set the status to "returnrequest".
  returnOrder: (orderId,reason) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db

          .get()

          .collection(collection.ORDER_COLLECTION)

          .updateOne(

            { _id: ObjectId(orderId) },

            { $set: { OrderStatus: 'returnrequest' ,reason:reason} }

          );

        resolve({ returnrequest: true });

      } catch (error) {

        reject(error);

      }

    });

  },
  // adduserAddress:
// This function adds a user address.
// It takes the user ID and user details,
// and then adds a new address document to the address collection.

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
  // makePrimaryAddress:
// This function sets a user address as primary.
// It takes the user ID and address ID,
// and then updates the address collection to set the primary flag of the specified address to true.

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
// generateRazorpay:
// This function generates a Razorpay payment link.
// It takes the order ID and total amount,
// and then generates a payment link using the Razorpay API.
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
// verifyPayment:
// This function verifies a Razorpay payment.
// It takes the payment details,
// and then verifies the payment using the Razorpay API.
  verifyPayment: (details) => {

    return new Promise((resolve, reject) => {

      try {

        const crypto = require('crypto');

        let hmac = crypto.createHmac('sha256', process.env.KEY_SECREAT);

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
// changePaymentStatus:
// This function changes the status of an order to "payed".
// It takes the order ID,
// and then updates the order collection to set the status to "payed".
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
  // searchProducts:
// This function searches for products.
// It takes the search query,
// and then queries the product collection to find products that match the search query.

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

// getTotalProductCount:
// This function gets the total number of products.
// It queries the product collection to get the total number of documents.
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
// getPaginatedProducts:
// This function gets the paginated products.
// It takes the number of products per page and the current page number,
// and then queries the product collection to get the paginated products.
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
// getCategory:
// This function gets the categories.
// It queries the category collection to get the list of categories.
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
  // getCategoryByName:
// This function gets the category by name.
// It takes the category name,
// and then queries the category collection to get the category.
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
  // getProductById:
// This function gets the product by ID.
// It takes the product ID,
// and then queries the product collection to get the product.
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
// listCategorys:
// This function lists the products in a category.
// It takes the category ID,
// and then queries the product collection to get the products in the category.
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
  // couponExist:
// This function checks if a coupon exists.
// It takes the coupon code,
// and then queries the coupon collection to see if the coupon exists.
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
// getOrder:
// This function gets the order for a user.
// It takes the user ID,
// and then queries the order collection to get the order.
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



// addDiscountedTotal:
// This function adds the discounted total to the cart.
// It takes the user ID, the discounted total, and the total amount,
// and then updates the cart collection to add the discounted total.
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
  // addDiscountedTotalChange:
// This function changes the discounted total in the cart.
// It takes the user ID and the discounted total,
// and then updates the cart collection to change the discounted total.

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
  // checkCartTotalChange:
// This function resets the checkCartTotal in the cart.
// It takes the user ID,
// and then updates the cart collection to reset the checkCartTotal.

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
  // getDiscountedAmount:
// This function gets the discounted amount from the cart.
// It takes the user ID,
// and then queries the cart collection to get the discounted amount.
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
// getCheckCartTotal:
// This function gets the checkCartTotal from the cart.
// It takes the user ID,
// and then queries the cart collection to get the checkCartTotal.
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

// addToUsedCoupon:
// This function adds a coupon to the usedCoupons collection.
// It takes the user ID and the coupon code,
// and then updates the usedCoupons collection to add the coupon.

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
// isAlreadyUsed:
// This function checks if a coupon has already been used.
// It takes the user ID and the coupon code,
// and then queries the usedCoupons collection to see if the coupon has already been used.
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
  // isAlreadyUsedCoupon:
// This function checks if a coupon has already been used by the user.
// It takes the user ID and the coupon code,
// and then queries the usedCoupons collection to see if the coupon has already been used by the user.
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
  // isChanged:
// This function checks if a coupon's status has been changed.
// It takes the user ID and the coupon code,
// and then queries the usedCoupons collection to see if the coupon's status has been changed.
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
  // Function to update the status of a coupon as "used" for a specific user
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
  
// Function to remove an item from a user's wishlist
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
// Function to remove an address from a user's list of addresses

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
// Function to get user details by user ID

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
  // Function to get available coupons for a user, excluding used ones

  getCoupons: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const currentDate = new Date();
  
        // Get the used coupons for the user
        const usedCoupons = await db
          .get()
          .collection(collection.USED_COUPON_COLLECTION)
          .findOne({ user: ObjectId(userId) });
  
        const usedCouponCodes = usedCoupons
          ? usedCoupons.coupons
              .filter((coupon) => coupon.status === "used")
              .map((coupon) => coupon.couponCode)
          : [];
  
        // Find the available coupons excluding the used ones
        const coupons = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .find({
            removed: false,
            couponcode: { $nin: usedCouponCodes },
          })
          .toArray();
  
        resolve(coupons);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // Function to deduct a specific amount from a user's wallet


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
// Function to update the status of an order

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
  // Function to update the status of an order (alias for 'updateOrderStatus')

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
  // Function to check if a provided password matches the user's password

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
  // Function to change a user's password

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
// Function to change a user's password when using a 'Forgot Password' feature

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
  // Function to add a random token to a user's data


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
// Function to change the status of a coupon (from "used" to "")

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
  // Function to check if a product is already in the user's cart

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
  // Function to generate a payment order for wallet recharge using Razorpay

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
  // Function to remove an applied coupon from a user's list of used coupons


  removeAppliedCoupon: (couponCode, userId) => {

    return new Promise(async (resolve, reject) => {

      try {

        const usedCouponsCollection = db.get().collection(collection.USED_COUPON_COLLECTION);

        const query = { user: ObjectId(userId) };

        const update = { $pull: { coupons: couponCode } };

        await usedCouponsCollection.updateOne(query, update);

        resolve();

      } catch (error) {

        reject(error);

      }

    });

  },
  // Function to add/update the changed total amount in the user's cart

  addChangedTotal: (userId, cartTotal) => {
    return new Promise(async (resolve, reject) => {
      try {
        let updated = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { user: ObjectId(userId) },
            {
              $set: {
                discountedAmount: cartTotal,
              },
            }
          );
        resolve(updated);
      } catch (error) {
        reject(error);
      }
    });
  },
  

  
  
};



