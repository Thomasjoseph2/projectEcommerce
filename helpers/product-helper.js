var db = require('../model/connection')
var collection = require('../model/collections')
var objectId = require('mongodb').ObjectId;
const fs = require('fs');
const { reject } = require('promise');
const { resolve } = require('path');
module.exports = {
  addProduct: (product, callback) => {
    product.productPrice = parseFloat(product.productPrice);
    if(!product.productOffer){
      product.productOffer=0
    }else{
      product.productOffer=parseInt(product.productOffer)
    }
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
          let imagePath = './public/product-images/' + product._id + '.jpg';
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log('Image deleted successfully');
            }
          });
          db.get().collection(collection.PRODUCT_COLLECTION)
            .deleteOne({ _id: objectId(proId) })
            .then((response) => {
              resolve(response)
            })
            .catch((error) => {
              reject(error)
            })
        })
    })
  },
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
        resolve(product)
      })
    })
  },
  updateProduct: (proId, proDetails, categoryId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
        {
          $set: {
            productName: proDetails.productName,
            productCategory: categoryId,
            productDescription: proDetails.productDescription,
            productPrice: parseFloat(proDetails.productPrice)
          }
        }).then((response) => {
          resolve(response)
        })
    })
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