
function addToCart(productId) {
  $.ajax({
    url: '/wishlist-to-cart/' + productId,
    type: 'GET',
    success: function(response) {
      if (response.message === "Added to cart") {
        showPopupMessage("Item added to cart");
        setTimeout(function() {
          location.reload(); // Reload the page after 2 seconds
        }, 1000);
      } else {
        showPopupMessage("Please login");
      }
    },
    error: function(error) {
      console.error('Error occurred while adding to cart:', error);
      showPopupMessage('Error adding to cart');
    }
  });
}

function showPopupMessage(message) {
  var popupMessage = document.getElementById('popupMessage');
  popupMessage.innerText = message;
  popupMessage.style.display = 'block';
  setTimeout(function() {
    popupMessage.style.display = 'none';
  }, 1000);
}

function removeProductFromWishlist(proId) {
  var confirmation = confirm("Are you sure you want to remove this product from the wishlist?");
  if (confirmation) {
    $.ajax({
      url: '/remove-product-from-wishlist',
      data: {
        proId: proId
      },
      method: 'post',
      success: function(response) {
        if (response.wishlistProductRemoved) {
          location.reload();
        }
      }
    });
  }
}
