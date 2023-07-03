var db = require('../model/connection')
var collection = require('../model/collections')
var objectId = require('mongodb').ObjectId;
const fs = require('fs');
const { reject } = require('promise');
const { resolve } = require('path');
module.exports = {
  addProduct: (product,arrayImage,callback) => {
    product.productOffer=0
    product.images=arrayImage
    product.productPrice = parseInt(product.productPrice);
    product.offerPrice=product.productPrice
    db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
      callback(data)

    })

  }, addToCategory: (categorys, productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { categoryName: categorys },
          {
            $push: { products: productId }
          }
        )
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  , 

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)
    })
  }
  ,
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION)
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
          
          db.get().collection(collection.PRODUCT_COLLECTION)
            .deleteOne({ _id: objectId(proId) })
            .then((response) => {
              resolve(response);
            })
            .catch((error) => {
              reject(error);
            });
        });
    });
  }
  ,
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
        resolve(product)
      })
    })
  },
  updateProduct: (proId, proDetails, categoryId, req) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          const updateData = {
            productName: proDetails.productName,
            productCategory: categoryId,
            productDescription: proDetails.productDescription,
            productPrice: parseFloat(proDetails.productPrice),
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
    });
  }
  ,
  getProductById: (productId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }, (err, product) => {
        if (err) {
          reject(err);
        } else {
          resolve(product);
        }
      });
    });
  }
,

getCategoryId: (categoryName, callback) => {
  db.get()
    .collection(collection.CATEGORY_COLLECTION)
    .findOne({ categoryName: categoryName })
    .then((category) => {
      callback(category._id);
    });
},

updateProductCategory: (productId, categoryId, callback) => {
  db.get()
    .collection(collection.PRODUCT_COLLECTION)
    .updateOne(
      { _id: objectId(productId) },
      { $set: { productCategory: categoryId } }
    )
    .then(() => {
      callback();
    });
},
isProductExist:  (ctId) => {
   return new Promise(async(resolve, reject) => {
   await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .find({ productCategory: objectId(ctId) }).toArray()
      .then((product) => {
        console.log(product)
        if (product.length > 0) {
          resolve(true); // Resolve true if products exist
        } else {
          resolve(false); // Resolve false if no products exist
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}





}