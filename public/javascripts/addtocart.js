
function showPopupMessage(message) {
  // Set the message content
  document.getElementById("popupMessage").textContent = message;
  
  // Show the modal
  $('#popupModal').modal('show');
}

function addToCart(productId) {
  // Send an AJAX request to the server
  $.ajax({
    url: '/add-to-cart/' + productId,
    type: 'GET',
    success: function(response) {
      if (response.message === "Added to cart") {
        showPopupMessage("Item added to cart");
      } else {
        showPopupMessage("please login");
      }
    },
    error: function(error) {
      console.error('Error occurred while adding to cart:', error);
      // Show an error message if needed
      showPopupMessage('Error adding to cart');
    }
  });
}
function addToWishlist(productId) {
  // Send an AJAX request to the server
  $.ajax({
    url: '/add-to-wishlist/' + productId,
    type: 'GET',
    success: function(response) {
      if (response.message === "Added to wishlist") {
        showPopupMessage("Item added to wishlist");
      } else {
        showPopupMessage("Please login");
      }
    },
    error: function(error) {
      console.error('Error occurred while adding to wishlist:', error);
      // Show an error message if needed
      showPopupMessage('Error adding to wishlist');
    }
  });
}
