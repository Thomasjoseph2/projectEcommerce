
function addToCart(productId) {

  $.ajax({

    url: '/wishlist-to-cart/' + productId,

    type: 'GET',

    success: function(response) {

      if (response.message === "Added to cart") {

        showPopupMessage("Item added to cart", 'success');

        setTimeout(function() {

          //location.reload(); // Reload the page after 2 seconds

        }, 1000);

      } else if (response.message === "Item out of stock") {

        showPopupMessage("Item out of stock", 'warning');

      } else {

        showPopupMessage("Please login", 'error');

      }

    },

    error: function(error) {

      console.error('Error occurred while adding to cart:', error);

      showPopupMessage('Error adding to cart', 'error');

    }

  });

}


function showPopupMessage(message, type) {

  Swal.fire({

    text: message,

    icon: type,

    timer: 1000,

    showConfirmButton: false

  });

}

function removeProductFromWishlist(proId) {

  Swal.fire({

    title: 'Remove Product',

    text: 'Are you sure you want to remove this product from the wishlist?',

    icon: 'question',

    showCancelButton: true,

    confirmButtonColor: '#3085d6',

    cancelButtonColor: '#d33',

    confirmButtonText: 'Yes, remove it!'

  }).then((result) => {

    if (result.isConfirmed) {

      $.ajax({

        url: '/remove-product-from-wishlist',

        data: {

          proId: proId

        },

        method: 'post',

        success: function(response) {

          if (response.wishlistProductRemoved) {

            showPopupMessage('Product removed from wishlist', 'success');

            setTimeout(function() {

              location.reload();

            }, 1000);

          } else {

            showPopupMessage('Failed to remove product from wishlist', 'error');

            setTimeout(function() {

              window.location.href = '/'; // Redirect to the home page

            }, 1000);

          }

        },

        error: function() {

          showPopupMessage('Error occurred while removing product from wishlist', 'error');

          setTimeout(function() {

            window.location.href = '/'; // Redirect to the home page

          }, 1000);

        }

      });

    }

  });

}

