const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const Promise = require('promise');
const pdfPrinter = require("pdfmake");
const fs=require('fs')
module.exports = {

// Controller function for admin login
doLogin: async (adminData) => {

  try {

    // Find the admin in the database based on the provided email

    const admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email });


    
    if (admin) {
    
      // If the admin exists


      // Compare the provided password with the stored password
      
      const passwordMatch = await (adminData.password, admin.password);

      if (passwordMatch) {
      
        // If the passwords match, return the admin details and set the status to true
      
        return {
      
          admin: admin,
      
          status: true,
      
        };
      } else {
      
        // If the passwords do not match, return status as false (login failed)
      
        return { status: false };
      
      }
    
    } else {
    
      // If the admin does not exist, return status as false (login failed)
    
      return { status: false };
    
    }
  
  } catch (error) {
  
    // If an error occurs during login, log the error and throw it for handling
  
    console.error('Error occurred during login:', error);
  
    throw error;
  
  }

},


// Function to get user details for non-blocked users

getUserDetails: () => {

  return new Promise(async (resolve, reject) => {

    try {

      // Retrieve all users from the database where 'blocked' is false

      const users = await db.get().collection(collection.USER_COLLECTION).find({ blocked: false }).toArray();

      // Resolve the promise with the array of non-blocked users

      resolve(users);

    } catch (error) {

      // If an error occurs while fetching user details, reject the promise with the error

      reject(error);

    }

  });

},



 // Function to get user details for blocked users

 getBlockedUserDetails: () => {

  return new Promise(async (resolve, reject) => {

    try {

      // Retrieve all users from the database where 'blocked' is true

      const blockedUsers = await db.get().collection(collection.USER_COLLECTION).find({ blocked: true }).toArray();

      // Resolve the promise with the array of blocked users

      resolve(blockedUsers);

    } catch (error) {

      // If an error occurs while fetching blocked user details, reject the promise with the error

      reject(error);

    }

  });

},


  // Function to block a user by updating the 'blocked' status to true in the database

  blockUser: (userId) => {

    return new Promise((resolve, reject) => {

      try {

        // Update the 'blocked' status to true for the specified user ID

        db.get().collection(collection.USER_COLLECTION).updateOne(

          { _id: ObjectId(userId) },

          { $set: { blocked: true } },

          (error) => {

            if (error) {

              // If an error occurs while updating, reject the promise with the error

              reject(error);

            } else {

              // Resolve the promise when the user is successfully blocked

              resolve();

            }
        }

        );

      } catch (error) {
      // If an error occurs while processing the blockUser function, reject the promise with the error

      reject(error);

    }

  });

},
// Function to add an offer to a category by updating the 'categoryOffer' field in the database

addOffer: (ctId, offer) => {

  return new Promise((resolve, reject) => {

    try {

      // Update the 'categoryOffer' field with the provided offer value for the specified category ID

      db.get().collection(collection.CATEGORY_COLLECTION).updateOne(

        { _id: ObjectId(ctId) },

        { $set: { categoryOffer: offer } },

        (error) => {

          if (error) {

            // If an error occurs while updating, reject the promise with the error

            reject(error);

          } else {

            // Resolve the promise when the offer is successfully added to the category

            resolve();

          }

        }

        );


      } catch (error) {

        // If an error occurs while processing the addOffer function, reject the promise with the error

        reject(error);

      }

    });

  },




  // Function to add an offer to a product by updating the 'productOffer' and 'offerPrice' fields in the database

  addproductOffer: (proId, offer) => {

    return new Promise((resolve, reject) => {

      try {

        // Find the product with the provided product ID

        db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) }, (error, product) => {

          if (error) {

            // If an error occurs while finding the product, reject the promise with the error

            reject(error);

          } else {


            if (product) {

              // If the product is found, extract the productOffer and productPrice from the product document

              const productOffer = parseFloat(offer);

              const productPrice = parseFloat(product.productPrice);

            // Calculate the offerPrice based on the productPrice and productOffer

            const offerPrice = productPrice - (productPrice * (productOffer / 100));

            // Update the 'productOffer' and 'offerPrice' fields in the product document

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(

              { _id: ObjectId(proId) },

              { $set: { productOffer: productOffer, offerPrice: Math.floor(offerPrice) } },

              (error) => {

                if (error) {

                  // If an error occurs while updating, reject the promise with the error

                  reject(error);

                } else {

                  // Resolve the promise when the offer is successfully added to the product

                  resolve();

                }

              }

              );

            } else {

              // If the product is not found, reject the promise with an error message

              reject(new Error('Product not found'));

            }
        }


      });

    } catch (error) {

      // If an error occurs while processing the addproductOffer function, reject the promise with the error

      reject(error);

    }

  });

},



// Function to unblock a user by updating the 'blocked' field to false in the database

unblockUser: (userId) => {

  return new Promise((resolve, reject) => {

    try {

      // Update the 'blocked' field of the user document with the provided user ID

      db.get().collection(collection.USER_COLLECTION).updateOne(

        { _id: ObjectId(userId) },

        { $set: { blocked: false } },

        (error) => {

          if (error) {

            // If an error occurs while updating, reject the promise with the error

            reject(error);

          } else {
            // Resolve the promise when the user is successfully unblocked

            resolve();

          }

        }

        );

      } catch (error) {

        // If an error occurs while processing the unblockUser function, reject the promise with the error

        reject(error);

      }

    });
},



// Function to check if a user with the provided email is blocked or not

isBlocked: (useremail) => {

  return new Promise((resolve, reject) => {

    try {

      // Find the user with the provided email

      db.get().collection(collection.USER_COLLECTION).findOne({ email: useremail }, (err, user) => {

        if (err) {

          // If an error occurs while finding the user, reject the promise with the error

          reject(err);

        } else {

          if (user && user.blocked === true) {

            // If the user is found and blocked is true, resolve the promise with true

            resolve(true);

          } else {

            // If the user is not found or blocked is false, resolve the promise with false

            resolve(false);

          }

        }

      });

    } catch (error) {

      // If an error occurs while processing the isBlocked function, reject the promise with the error

      reject(error);

    }

  });

},



  // Function to check if a user with the provided user ID is blocked or not

  isUserBlocked: (userId) => {

    return new Promise((resolve, reject) => {

      try {

        // Find the user with the provided user ID

        db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) }, (err, user) => {

          if (err) {

            // If an error occurs while finding the user, reject the promise with the error

            reject(err);

          } else {

            if (user && user.blocked === true) {

              // If the user is found and blocked is true, resolve the promise with true

              resolve(true);

            } else {

              // If the user is not found or blocked is false, resolve the promise with false

              resolve(false);

            }

          }

        });

      } catch (error) {

        // If an error occurs while processing the isUserBlocked function, reject the promise with the error

        reject(error);

      }

    });

  },

// Function to check if a user with the provided phone number is blocked or not

userisSBlocked: (searchTerm) => {

  return new Promise(async (resolve, reject) => {

    try {

      searchTerm = "+91" + searchTerm;

      // Find the user with the provided phone number

      const user = await db

      .get()

      .collection(collection.USER_COLLECTION)

      .findOne({ phonenumber: searchTerm });


      
      if (user && user.blocked === true) {
      
        // If the user is found and blocked is true, resolve the promise with true
      
        resolve(true);
      
      } else {
        // If the user is not found or blocked is false, resolve the promise with false
      
        resolve(false);
      
      }
    } 
    
    catch (error) {
    
      // If an error occurs while processing the userisSBlocked function, reject the promise with the error
    
      reject(error);
    
    }
 
  });

},


// Function to get all categories from the database

getCategory: () => {

  return new Promise(async (resolve, reject) => {

    try {

      // Fetch all categories from the CATEGORY_COLLECTION

      const categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();

      resolve(categories);

    } catch (error) {

      // If an error occurs while processing the getCategory function, reject the promise with the error

      reject(error);

    }

  });

},



// Function to remove a category with the provided category ID from the database

removeCategory: (ctId) => {

  return new Promise(async (resolve, reject) => {

    try {

      // Delete the category document with the provided category ID

      await db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: ObjectId(ctId) });

      resolve();

    } catch (error) {

      // If an error occurs while processing the removeCategory function, reject the promise with the error

      reject(error);

    }

  });

},



// Function to check if a category with the provided category name already exists in the database
checkCategoryExists: (categoryName) => {

  return new Promise((resolve, reject) => {

    try {

      // Find a category with the provided category name (case-insensitive search)

      db.get()

      .collection(collection.CATEGORY_COLLECTION)

      .findOne({ categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } })

      .then((category) => {

        if (category) {

          // If a category is found, resolve the promise with true (category exists)

          resolve(true);

        } else {

          // If no category is found, resolve the promise with false (category does not exist)

          resolve(false);

        }

      })

      .catch((error) => {

        // If an error occurs while processing the checkCategoryExists function, reject the promise with the error

        reject(error);

      });

    } catch (error) {

      // If an error occurs while processing the checkCategoryExists function, reject the promise with the error

      reject(error);

    }

  });

},



// Function to add a new category to the database

addCategory: (categoryData) => {

  categoryData.categoryOffer = 0;

  return new Promise((resolve, reject) => {

    try {

      // Insert the categoryData into the CATEGORY_COLLECTION

      db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData, (error, result) => {

        if (error) {

          // If an error occurs while inserting the categoryData, reject the promise with the error

          reject(error);

        } else {

          // If the categoryData is successfully inserted, resolve the promise with the categoryData

          resolve(categoryData);

        }

      });

    } catch (error) {

      // If an error occurs while processing the addCategory function, reject the promise with the error

      reject(error);

    }

  });


},



 // Function to get a category from the database by its ID

 getCategoryById: (categoryId) => {

  return new Promise((resolve, reject) => {

    try {

      // Find the category with the provided category ID


      db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectId(categoryId) })

      .then((category) => {

        // Resolve the promise with the found category

        resolve(category);

      })


      .catch((error) => {


        // If an error occurs while finding the category, reject the promise with the error

        reject(error);

      });

    } catch (error) {

      // If an error occurs while processing the getCategoryById function, reject the promise with the error

      reject(error);

    }

  });

},



// Function to get a list of all orders from the database

getOrderList: () => {

  return new Promise(async (resolve, reject) => {

    try {

      // Fetch all orders from the ORDER_COLLECTION and sort them by date in descending order

      const orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ date: -1 }).toArray();

      resolve(orders);

    } catch (error) {

      // If an error occurs while processing the getOrderList function, reject the promise with the error

      reject(error);


    }

  });

},



// Function to get a list of all delivered orders from the database

getDeleveredOrders: () => {

  return new Promise(async (resolve, reject) => {

    try {

      // Fetch all orders from the ORDER_COLLECTION with the OrderStatus set to 'delivered'

      const orders = await db.get().collection(collection.ORDER_COLLECTION).find({ OrderStatus: 'delivered' }).toArray();

      resolve(orders);

    } catch (error) {

      // If an error occurs while processing the getDeleveredOrders function, reject the promise with the error

      reject(error);

    }

  });

},



// Function to get a list of all orders from the database

getAllOrders: () => {

  return new Promise(async (resolve, reject) => {

    try {

      // Fetch all orders from the ORDER_COLLECTION

      const orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray();

      resolve(orders);

    } catch (error) {

      // If an error occurs while processing the getAllOrders function, reject the promise with the error


      reject(error);

    }

  });

},


// Function to get products in an order from the database by the order ID

getProductsInOrder: (orderId) => {

  return new Promise(async (resolve, reject) => {

    try {

      // Perform an aggregation to get the products in the specified order

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


      
      resolve(orderItems);
    } 
    catch (error) {
    
      // If an error occurs while processing the getProductsInOrder function, reject the promise with the error
    
      reject(error);
    
    }
  })
  ;
},





// Function to get the address of an order from the database by the order ID

getOrderAddress: (orderId) => {

  return new Promise(async (resolve, reject) => {

    try {

      // Find the order with the provided order ID and project only the 'address' field

      let order = await db.get().collection(collection.ORDER_COLLECTION).findOne(

        { _id: ObjectId(orderId) },

        { projection: { _id: 0, 'address': 1 } }

        );


      if
       (order) {
      
        // If the order is found, resolve the promise with the address
      
        const { address } = order;
      
        resolve(address);
      
      } else {
      
        // If the order is not found, reject the promise with an error message
      
        reject(new Error('Order not found'));
      
      }
    } 
    catch (error) {
    
      // If an error occurs while processing the getOrderAddress function, reject the promise with the error
    
      reject(error);
    
    }
  
  })
  ;

},



// Function to change the status of an order in the database by the order ID

changeStatusOrder: (orderId, orderStatus) => {

  return new Promise(async (resolve, reject) => {

    try {

      // Update the OrderStatus of the order with the provided order ID

      await db.get().collection(collection.ORDER_COLLECTION).updateOne(

        { _id: ObjectId(orderId) },

        { $set: { OrderStatus: orderStatus } }

        );

        resolve();

      } catch (error) {

        // If an error occurs while processing the changeStatusOrder function, reject the promise with the error

        reject(error);

      }

    });

  },

// Function to add a new coupon to the database

addCoupon: (coupon) => {

  return new Promise(async (resolve, reject) => {

    try {

      // Insert the coupon into the COUPON_COLLECTION

      await db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((coupon) => {


        resolve(coupon);

      });

    } catch (err) {

      // If an error occurs while processing the addCoupon function, reject the promise with the error

      reject(err);

    }

  });

},


// Function to get a list of all coupons from the database

getAllCoupons: () => {

  return new Promise(async (resolve, reject) => {

    try {

      // Fetch all coupons from the COUPON_COLLECTION where removed field is false and sort them by createdAt field in descending order

      const coupons = await db

      .get()

      .collection(collection.COUPON_COLLECTION)

      .find({ removed: false })

      .sort({ createdAt: -1 })

      .toArray();

      resolve(coupons);

    } catch (error) {

      // If an error occurs while processing the getAllCoupons function, reject the promise with the error

      reject(error);

    }

  });

},

// adminHelper.js

// Function to remove a coupon from the database by the coupon ID
removeCoupon: (couponId) => {

  return new Promise(async (resolve, reject) => {

    try {

      // Update the removed field of the coupon with the provided coupon ID to true

      await db.get().collection(collection.COUPON_COLLECTION).updateOne(

        { _id: ObjectId(couponId) },

        { $set: { removed: true } }

        );

        resolve();

      } catch (error) {

        // If an error occurs while processing the removeCoupon function, reject the promise with the error

        reject(error);

      }

    });

  },



 // Function to check if a coupon exists in the database by its code

 couponExists: (coupon) => {

  return new Promise(async (resolve, reject) => {

    try {

      const couponExists = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponcode: coupon });

      if (couponExists) {

        resolve(true); // Coupon exists

      } else {

        resolve(false); // Coupon does not exist

      }

    } catch (error) {

      // If an error occurs while processing the couponExists function, reject the promise with the error

      reject(error);

    }

  });

},


// Function to get a list of orders from the database based on given filters

getOrders: (filters) => {

  return new Promise(async (resolve, reject) => {

    try {

      let query = {};


      
      if (filters.status) {
      
        query.OrderStatus = filters.status;
      
      }


      
      if (filters.paymentMethod) {
      
        query.paymentMethod = filters.paymentMethod;
      
      }

      const orders = await db.get().collection(collection.ORDER_COLLECTION).find(query).toArray();
      
      resolve(orders);
   
    } catch (error) {
      // If an error occurs while processing the getOrders function, reject the promise with the error
   
      reject(error);
   
    }
  
  });

},

// Function to get a list of orders with the status "cancelrequest" from the database

getCancelRequests: () => {

  return new Promise(async (resolve, reject) => {

    try {

      const cancelRequests = await db.get().collection(collection.ORDER_COLLECTION).find({ OrderStatus: "cancelrequest" }).toArray();


      resolve(cancelRequests);

    } catch (error) {

      // If an error occurs while processing the getCancelRequests function, reject the promise with the error

      reject(error);

    }

  });

},


// Function to get a list of orders with the status "returnrequest" from the database

getReturnRequests: () => {

  return new Promise(async (resolve, reject) => {

    try {

      const returnRequests = await db.get().collection(collection.ORDER_COLLECTION).find({ OrderStatus: "returnrequest" }).toArray();

      resolve(returnRequests);

    } catch (error) {

      // If an error occurs while processing the getReturnRequests function, reject the promise with the error

      reject(error);

    }

  });

},


// Function to get the status of an order from the database by its order ID

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

      // If an error occurs while processing the getOrderStatus function, reject the promise with the error

      reject(error);

    }

  });

},


// Function to get an order from the database by its order ID

getOrder: (orderId) => {

  return new Promise((resolve, reject) => {

    try {

      db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })

      .then((order) => {

        resolve(order);

      })

      .catch((error) => {

        reject(error);

      });

    } catch (error) {

      // If an error occurs while processing the getOrder function, reject the promise with the error

      reject(error);

    }

  });

},


// Function to update the wallet amount of a user in the database

updateWallet: (userId, totalAmount) => {

  return new Promise(async (resolve, reject) => {

    try {

      const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });

      if (user) {

        const currentAmount = user.walletAmount;

        const updatedAmount = currentAmount + totalAmount;

        await db.get().collection(collection.USER_COLLECTION).updateOne(

          { _id: ObjectId(userId) },

          { $set: { walletAmount: updatedAmount } }

          );

          resolve();

        } else {

          reject(new Error('User not found'));

        }

      } catch (error) {

        // If an error occurs while processing the updateWallet function, reject the promise with the error

        reject(error);

      }

    });

  },


// Function to get an order from the database by its order ID

getOrderById: (orderId) => {

  return new Promise((resolve, reject) => {

    try {

      db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })

      .then((order) => {

        resolve(order);

      })

      .catch((error) => {

        reject(error);

      });

    } catch (error) {

      // If an error occurs while processing the getOrderById function, reject the promise with the error

      reject(error);

    }

  });

},



salesPdf: async (req, res) => {

  try {

    let startY = 150;

    const writeStream = fs.createWriteStream('order.pdf');

    const printer = new pdfPrinter({

      Roboto: {

        normal: 'Helvetica',

        bold: 'Helvetica-Bold',

        italics: 'Helvetica-Oblique',

        bolditalics: 'Helvetica-BoldOblique',

      },

    });

    
      const orderCollection = await db.get().collection(collection.ORDER_COLLECTION).find().toArray();
  

      const totalAmountResult = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      
        {
      
          $match: {
      
            orderStatus: { $nin: ['cancelled'] },
      
          },
      
        },
      
        {
      
          $group: {
      
            _id: null,
      
            totalAmount: { $sum: '$totalAmound' },
      
          },
      
        },
      
      ]).toArray();
  

      
      const totalAmount = totalAmountResult[0]?.totalAmount || 0;
  

      const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      
      // Create document definition
      
      const docDefinition = {
      
        content: [
      
          { text: 'ShoppyBee', style: 'header' },
          { text: '\n' },
          { text: 'Order Information', style: 'header1' },
          { text: '\n' },
        ],
        styles: {
          header: {
            fontSize: 25,
            alignment: 'center',
          },
          header1: {
            fontSize: 12,
            alignment: 'center',
          },
          tableHeader: {
            bold: true,
            fontSize: 13,
            color: 'black',
            alignment: 'center',
          },
          tableRow: {
            fontSize: 12,
            color: 'black',
            alignment: 'center',
          },
          total: {
            fontSize: 18,
            alignment: 'center',
          },
        },
      };
  
      const tableHeader = [
        { text: 'Index', style: 'tableHeader' },
        { text: 'Date', style: 'tableHeader' },
        { text: 'User', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
        { text: 'Method', style: 'tableHeader' },
        { text: 'Amount', style: 'tableHeader' },
      ];
  
      const tableBody = [];
      for (let i = 0; i < orderCollection.length; i++) {
        const data = orderCollection[i];
  
        try {
          // Convert the date string to a valid date object
          const [datePart, timePart] = data.date.split(' ');
          const [day, month, year] = datePart.split('/');
          const [hour, minute, second] = timePart.split(':');
          const orderDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  
          // Format the date using Intl.DateTimeFormat
          const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(orderDate);
  
          tableBody.push([
            (i + 1).toString(), // Index value
            formattedDate,
            data.userName,
            data.OrderStatus,
            data.paymentMethod,
            data.totalAmound,
          ]);
        } catch (error) {
          console.log('Error parsing date:', data.date);
          console.log(error);
        }
      }
  
      const table = {
        widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [tableHeader, ...tableBody],
      };
  
      // Add the table to the document definition
      docDefinition.content.push({ table, style: 'tableRow' });
      docDefinition.content.push({ text: '\n' }, { text: `Total: ${totalAmount}`, style: 'total' });
      // Generate PDF from the document definition
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
  
      // Pipe the PDF document to a write stream
      pdfDoc.pipe(writeStream);
  
      // Finalize the PDF and end the stream
      pdfDoc.end();
  
      writeStream.on('finish', () => {
        res.download('order.pdf', 'order.pdf');
      });
    } catch (error) {
      console.log('pdfSales helper error');
      console.log(error, 'error');
    }
  }
  ,
  
getPaymentCounts :(req,res) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pipeline = [
        {
          $group: {
            _id: '$paymentMethod', // Group by the paymentMethod field
            count: { $sum: 1 }, // Calculate the count for each payment method
          },
        },
      ];

      const paymentCounts = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate(pipeline)
        .toArray();

      // Format the result to be a dictionary with paymentMethod as key and count as value
      const paymentCountsMap = paymentCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      resolve(paymentCountsMap);
    } catch (error) {
      reject(error);
    }
  });
}

  
  
  
  
  
};



