$(document).ready(function () {
    // Handle click event on delete button
    $('.remove-coupon').on('click', function (event) {
      event.preventDefault();
      var couponId = $(this).data('coupon-id');
      
      // Display the Swal confirmation popup
      Swal.fire({
        icon: 'question',
        title: 'Confirm Coupon Removal',
        text: 'Are you sure you want to remove this coupon?',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Perform AJAX request to remove the coupon
          $.ajax({
            url: '/admin/remove-coupon?id=' + couponId,
            method: 'GET',
            success: function (response) {
              // If the coupon is successfully removed, reload the page or perform any other desired action
              window.location.reload();
            },
            error: function (error) {
              console.log('Error removing coupon: ' + error);
            }
          });
        }
      });
    });
  });
  
  
  