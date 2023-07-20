const db = require('../model/connection');
const collection = require('../model/collections');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const Promise = require('promise');
const pdfPrinter = require("pdfmake");
const fs=require('fs')
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

      try {

        db.get()


          .collection(collection.USER_COLLECTION)

          .updateOne({ _id: ObjectId(userId) }, { $set: { blocked: true } }, (error) => {

            if (error) {

              reject(error);

            } else {

              resolve();

            }

          });

      } catch (error) {

        reject(error);

      }

    });

  },

  addOffer: (ctId, offer) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.CATEGORY_COLLECTION)

          .updateOne({ _id: ObjectId(ctId) }, { $set: { categoryOffer: offer } }, (error) => {

            if (error) {

              reject(error);

            } else {

              resolve();

            }

          });

      } catch (error) {

        reject(error);

      }

    });

  },



  addproductOffer: (proId, offer) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.PRODUCT_COLLECTION)

          .findOne({ _id: ObjectId(proId) }, (error, product) => {

            if (error) {

              reject(error);

            } else {

              if (product) {

                const productOffer = parseFloat(offer);

                const productPrice = parseFloat(product.productPrice);

                const offerPrice = productPrice - (productPrice * (productOffer / 100));

                db.get().collection(collection.PRODUCT_COLLECTION).updateOne(

                  { _id: ObjectId(proId) },

                  { $set: { productOffer: productOffer, offerPrice: Math.floor(offerPrice) } },

                  (error) => {

                    if (error) {

                      reject(error);

                    } else {

                      resolve();

                    }

                  }

                );

              } else {

                reject(new Error('Product not found'));

              }

            }

          });

      } catch (error) {

        reject(error);

      }

    });

  },


  unblockUser: (userId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.USER_COLLECTION)

          .updateOne({ _id: ObjectId(userId) }, { $set: { blocked: false } }, (error) => {

            if (error) {

              reject(error);

            } else {

              resolve();

            }

          });

      } catch (error) {

        reject(error);

      }

    });

  },



  isBlocked: (useremail) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.USER_COLLECTION)

          .findOne({ email: useremail }, (err, user) => {

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

      } catch (error) {

        reject(error);

      }

    });

  },


  isUserBlocked: (userId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.USER_COLLECTION)

          .findOne({ _id: ObjectId(userId) }, (err, user) => {

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

      } catch (error) {

        reject(error);

      }

    });

  },


  userisSBlocked: (searchTerm) => {

    return new Promise(async (resolve, reject) => {

      try {

        searchTerm = "+91" + searchTerm;

        const user = await db

          .get()

          .collection(collection.USER_COLLECTION)

          .findOne({ phonenumber: searchTerm });


        if (user && user.blocked === true) {

          resolve(true);

        } else {

          resolve(false);

        }
      }
      catch (error) {

        reject(error);

      }
    })
      ;
  },


  getCategory: () => {

    return new Promise(async (resolve, reject) => {

      try {

        const categories = await db.get()

          .collection(collection.CATEGORY_COLLECTION)

          .find()

          .toArray();

        resolve(categories);

      } catch (error) {

        reject(error);

      }

    });

  },


  removeCategory: (ctId) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db.get()

          .collection(collection.CATEGORY_COLLECTION)

          .deleteOne({ _id: ObjectId(ctId) });

        resolve();

      } catch (error) {


        reject(error);

      }

    });

  },
//the function for checking categrory already exist or not 
  checkCategoryExists: (categoryName) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.CATEGORY_COLLECTION)
          .findOne({ categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } })
          .then((category) => {
            if (category) {
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch((error) => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
  

  addCategory: (categoryData) => {

    categoryData.categoryOffer = 0;

    return new Promise((resolve, reject) => {

      try {

        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData, (error, result) => {

          if (error) {

            reject(error);

          } else {

            resolve(categoryData);

          }

        });

      } catch (error) {

        reject(error);


      }

    });

  },

  getCategoryById: (categoryId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectId(categoryId) })

          .then((category) => {

            resolve(category);

          })

          .catch((error) => {

            reject(error);

          });

      } catch (error) {

        reject(error);

      }

    });

  },

  getOrderList: () => {

    return new Promise(async (resolve, reject) => {

      try {

        const orders = await db

          .get()

          .collection(collection.ORDER_COLLECTION)

          .find()

          .sort({ date: -1 })

          .toArray();

        resolve(orders);

      } catch (error) {

        reject(error);

      }

    });

  },


  getDeleveredOrders: () => {

    return new Promise(async (resolve, reject) => {

      try {

        const orders = await db

          .get()

          .collection(collection.ORDER_COLLECTION)

          .find({ OrderStatus: 'delivered' })

          .toArray();

        resolve(orders);

      } catch (error) {

        reject(error);

      }

    });

  },
  getAllOrders: () => {

    return new Promise(async (resolve, reject) => {

      try {

        const orders = await db

          .get()

          .collection(collection.ORDER_COLLECTION)

          .find()

          .toArray();

        resolve(orders);

      } catch (error) {

        reject(error);

      }

    });

  },


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

        resolve(orderItems);

      } catch (error) {

        reject(error);

      }

    });

  },

  getOrderAddress: (orderId) => {

    return new Promise(async (resolve, reject) => {

      try {

        let order = await db.get().collection(collection.ORDER_COLLECTION).findOne(

          { _id: ObjectId(orderId) },

          { projection: { _id: 0, 'address': 1 } }

        );

        if (order) {

          const { address } = order;

          resolve(address);

        } else {

          reject(new Error('Order not found'));

        }

      } catch (error) {

        reject(error);

      }

    });

  },

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
  addCoupon: (coupon) => {

    return new Promise(async (resolve, reject) => {

      try {



        await db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((coupon) => {

          resolve(coupon)

        })

      } catch (err) {

        reject(err);

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

            removed: false
          })

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



  couponExists: (coupon) => {

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


getOrders :(filters) => {

  return new Promise(async (resolve, reject) => {

    try {

      let query = {};

        if (filters.status) {

          query.OrderStatus= filters.status;

        }
  
        if (filters.paymentMethod) {

          query.paymentMethod = filters.paymentMethod;

        }
  
        const orders = await db

        .get()

        .collection(collection.ORDER_COLLECTION)

        .find(query)

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

        reject(error);

      }

    });

  }
  ,

  updateWallet: (userId, totalAmound) => {

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
      }
      catch (error) {

        reject(error);

      }

    });

  },
  getOrderById: (OrderId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(OrderId) })

          .then((order) => {

            resolve(order);

          })

          .catch((error) => {

            reject(error);

          });

      } catch (error) {

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
      console.log(orderCollection, 'orders');
  
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
  
  
  
  
  
  
};



