var db = require('../model/connection')

var collection = require('../model/collections')

var objectId = require('mongodb').ObjectId;

const fs = require('fs');

const Promise = require('promise');

const path = require('path');

module.exports = {
// Add a new product to the database
  addProduct: (product, arrayImage, callback) => {

    product.productOffer = 0;

    product.images = arrayImage;

    product.productPrice = parseInt(product.productPrice);

    product.productQuantity=parseInt(product.productQuantity)


    try {

      db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {

        callback(data);

      });

    } catch (error) {

      console.log(error);

      callback(null);

    }
  },
// Add a product to a specific category by updating the category's products array
  addToCategory: (categorys, productId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.CATEGORY_COLLECTION)

          .updateOne(

            { categoryName: categorys },

            {

              $push: { products: productId },

            })

          .then((response) => {

            resolve(response);

          })

          .catch((error) => {

            reject(error);

          });

      } catch (error) {

        console.log(error);

        reject(error);

      }

    });
  },
// Get all products from the database
  getAllProducts: () => {

    return new Promise(async (resolve, reject) => {

      try {

        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();

        resolve(products);

      } catch (error) {

        console.log(error);

        reject(error);

      }

    });

  },

// Delete a product from the database and unlink its images
  deleteProduct: (proId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.PRODUCT_COLLECTION)

          .findOne({ _id: objectId(proId) })

          .then((product) => {

            // Unlink each image in the images array

            product.images.forEach((image) => {

              let imagePath = './public/product-images/' + image;

              fs.unlink(imagePath, (err) => {

                if (err) {

                  console.log(err);

                } else {

                  console.log('Image deleted successfully');

                }

              });

            });


            db.get()

              .collection(collection.PRODUCT_COLLECTION)

              .deleteOne({ _id: objectId(proId) })

              .then((response) => {

                resolve(response);

              })

              .catch((error) => {

                reject(error);

              });

          });

      } catch (error) {

        console.log(error);

        reject(error);

      }

    });
  },


// Get product details by product ID
  getProductDetails: (proId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.PRODUCT_COLLECTION)

          .findOne({ _id: objectId(proId) })

          .then((product) => {

            resolve(product);

          });

      } catch (error) {

        console.log(error);

        reject(error);

      }

    });

  },
//update products
  updateProduct: (proId, proDetails, categoryId, req) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.PRODUCT_COLLECTION)

          .findOne({ _id: objectId(proId) })

          .then((product) => {

            const updateData = {

              productName: proDetails.productName,

              productCategory: categoryId,

              productDescription: proDetails.productDescription,

              productPrice: parseFloat(proDetails.productPrice),

              productQuantity:parseFloat(proDetails.productQuantity),

              images: product.images, // Keep the existing images by default

            };

            if (proDetails.images && req.files && req.files.length > 0) {

              updateData.images = req.files.map((file) => file.filename);

            }

            db.get()

              .collection(collection.PRODUCT_COLLECTION)

              .updateOne({ _id: objectId(proId) }, { $set: updateData })

              .then((response) => {

                resolve(response);

              })

              .catch((error) => {

                reject(error);

              });

          })

          .catch((error) => {

            reject(error);

          });

      } catch (error) {

        console.log(error);

        reject(error);

      }

    });

  },
//getting product by id

  getProductById: (productId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.PRODUCT_COLLECTION)

          .findOne({ _id: objectId(productId) }, (err, product) => {

            if (err) {

              reject(err);

            } else {

              resolve(product);

            }

          });


      } catch (error) {

        console.log(error);

        reject(error);

      }

    });

  },
//getting category by id
  getCategoryById: (categoryId) => {

    return new Promise((resolve, reject) => {

      try {

        db.get()

          .collection(collection.CATEGORY_COLLECTION)

          .findOne({ _id: objectId(categoryId) }, (err, category) => {


            if (err) {

              reject(err);

            } else {

              resolve(category);

            }

          });

      } catch (error) {

        console.log(error);

        reject(error);

      }

    });

  },
//get categories id

  getCategoryId: (categoryName, callback) => {

    try {

      db.get()

        .collection(collection.CATEGORY_COLLECTION)

        .findOne({ categoryName: categoryName })

        .then((category) => {

          callback(category._id);

        });

    } catch (error) {

      console.log(error);


      callback(null);

    }

  },
//helper function for update product quantity
  updateProductCategory: (productId, categoryId, callback) => {

    try {

      db.get()

        .collection(collection.PRODUCT_COLLECTION)

        .updateOne(

          { _id: objectId(productId) },

          { $set: { productCategory: categoryId } }

        )


        .then(() => {

          callback();

        });

    } catch (error) {

      console.log(error);

      callback();

    }

  },
 
//function to check the product exist or not
  isProductExist: (ctId) => {

    return new Promise(async (resolve, reject) => {

      try {

        await db.get()

          .collection(collection.PRODUCT_COLLECTION)

          .find({ productCategory: objectId(ctId) })

          .toArray()

          .then((product) => {

            if (product.length > 0) {

              resolve(true); // Resolve true if products exist

            } else {

              resolve(false); // Resolve false if no products exist

            }

          })
          .catch((error) => {

            reject(error);

          });

      } catch (error) {

        console.log(error);

        reject(error);

      }

    });

  },
//function to decrement quantity from the product quantity
    decrementQuantity: (productId, quantity) => {
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: productId },
            { $inc: { productQuantity: -quantity } }
          )
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
   //function to decrement quantity from the product quantity
    incrementQuantity: (productId, quantity) => {

      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: productId },
            { $inc: { productQuantity: quantity } }
          )
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
};

