function showPopupMessage(message, type = "info") {

  Swal.fire({
  
    text: message,
  
    icon: type,
  
    timer: 1500,
  
    showConfirmButton: false
  
  });

}

function addToCart(productId) {
 
  $.ajax({
  
    url: '/check-cart/' + productId,
  
    type: 'GET',
  
    success: function (response) {
  
      if (response.exists) {
  
        showPopupMessage("Item is already in the cart", "success");
  
      } else {
  
        $.ajax({
  
          url: '/add-to-cart/' + productId,
  
          type: 'GET',
  
          success: function (response) {
  
            if (response.message === "Added to cart") {
  
              showPopupMessage("Item added to cart", "success");
  
            } else if (response.message === "Item out of stock") {
  
              showPopupMessage("Item out of stock", "warning");
  
            } else {
  
              showPopupMessage("Please login", "warning");
  
            }
  
          },
  
          error: function (error) {
  
            console.error('Error occurred while adding to cart:', error);
  
            showPopupMessage('Error adding to cart', 'error');
  
          }
  
        });
  
      }
  
    },
  
    error: function (error) {
  
      console.error('Error occurred while checking the cart:', error);
  
      showPopupMessage('Error checking the cart', 'error');
  
    }
  
  });

}

function addToWishlist(productId) {

  $.ajax({

    url: '/add-to-wishlist/' + productId,

    type: 'GET',

    success: function (response) {

      if (response.message === "Added to wishlist") {

        showPopupMessage("Item added to wishlist", "success");

      } else {

        showPopupMessage("Please login", "warning");

      }

    },

    error: function (error) {

      console.error('Error occurred while adding to wishlist:', error);

      showPopupMessage('Error adding to wishlist', 'error');

    }

  });

}



