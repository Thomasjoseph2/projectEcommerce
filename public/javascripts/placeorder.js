$("#coupon-form").submit((e) => {
    e.preventDefault();
    const couponCode = $("#couponCode").val();
  
    $.ajax({
      url: '/apply-coupon',
      method: 'post',
      data: { couponCode },
      success: (response) => {
        if (response.couponExist) {
          // Display coupon applied message
          Swal.fire({
            icon: 'success',
            title: 'Coupon Applied',
            text: 'Coupon applied successfully!',
          }).then(() => {
            // Refresh the page after the alert is closed
            location.reload();
          });
        } else {
          // Display invalid coupon message
          let errorMessage = 'Invalid coupon!';
  
          if (response.expired) {
            errorMessage = 'Coupon expired!';
          } else if (response.alreadyUsed) {
            errorMessage = 'Coupon already used!';
          } else if (response.notApplicable) {
            errorMessage = 'Coupon is not applicable for this amount!';
          }
  
          Swal.fire({
            icon: 'error',
            title: 'Coupon Error',
            text: errorMessage,
          });
        }
      }
    });
  });
  
  $("#checkout-form").submit((e) => {
    e.preventDefault();
  
    const paymentMethod = $('input[name="payment-method"]:checked').val();
    const walletAmount = parseFloat($("#walletAmount").val());
    const total = parseFloat($("ul.list_2 li:last-child span").text().replace(/[^0-9.-]+/g,"")); // Extract the total amount from the page
  
    if (paymentMethod === "WALLET" && walletAmount < total) {
      // Show alert for insufficient wallet balance
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Wallet Balance',
        text: 'Please recharge your wallet to make the purchase using the wallet.',
      });
    } else {
      // Proceed with the order placement
      $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
          if (response.codStatus) {
            Swal.fire({
              icon: 'success',
              title: 'Order Placed',
              text: 'Your order has been placed successfully!',
            }).then(() => {
              location.href = '/order-success';
            });
          } else if (response.walletStatus) {
            Swal.fire({
              icon: 'success',
              title: 'Order Placed',
              text: 'Your order has been placed successfully!',
            }).then(() => {
              location.href = '/order-success';
            });
          } else if (response.walletStatus === false) {
            Swal.fire({
              icon: 'error',
              title: 'Insufficient Wallet Balance',
              text: 'You do not have enough balance in your wallet.',
            }).then(() => {
              location.href = '/order-list';
            });
          } else {
            razorpayPayment(response);
          }
        },
        error: (error) => {
          console.error('Error occurred while placing order:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error placing order: ' + error,
          });
        }
      });
    }
  });
  
  
      function razorpayPayment(order) {
          var options = {
              "key": "rzp_test_4VSqO0TCBFvtCE", // Enter the Key ID generated from the Dashboard
              "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
              "currency": "INR",
              "name": "ShoppyBee",
              "description": "Test Transaction",
              "image": "https://example.com/your_logo",
              "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
              "handler": function (response) {
  
                  verifypayment(response, order)
              },
              "prefill": {
                  "name": "Gaurav Kumar",
                  "email": "gaurav.kumar@example.com",
                  "contact": "9000090000"
              },
              "notes": {
                  "address": "Razorpay Corporate Office"
              },
              "theme": {
                  "color": "#3399cc"
              }
          };
          var rzp1 = new Razorpay(options);
           rzp1.open();
      }
      function verifypayment(payment,order){
         $.ajax({
          url:'/verify-payment',
          data:{
              payment,
              order
          },
          method:'post',
          success:(response)=>{
              if(response.status){
                  location.href = '/order-success'
              }else{
                  alert("payment failed")
              }
          }
         })
      }
  function redirectToAddAddress() {
    window.location.href = '/add-address'; // Replace '/add-address' with the actual URL of the address addition page
  }

  // JavaScript function to populate the address modal with data
function populateAddressModal() {
  var addressList = []; // Replace with your actual address list data

  var modalBody = document.querySelector("#addressModal .modal-body");
  modalBody.innerHTML = ""; // Clear previous content

  // Loop through the address list and create a list item for each address
  addressList.forEach(function (address) {
    var addressItem = document.createElement("div");
    addressItem.classList.add("address-item");
    addressItem.innerHTML = `
      <input type="radio" id="addressOption${address.id}" name="address-option" value="${address.id}">
      <label for="addressOption${address.id}">${address.address}</label>
    `;
    modalBody.appendChild(addressItem);
  });
}

// Event listener to populate the address modal when it is opened
document.querySelector("#addressModal").addEventListener("shown.bs.modal", function () {
  populateAddressModal();
});

// Get all the 'Choose Address' buttons
var chooseAddressBtns = document.querySelectorAll(".make-primary-btn");

// Add event listener to each button
chooseAddressBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    var addressId = this.getAttribute("data-address-id");
    makePrimaryAddress(addressId);
  });
});
function makePrimaryAddress(addressId) {
  $.ajax({
    url: '/make-primary-address',
    method: 'post',
    data: { addressId },
    success: function (response) {
      if (response.addressMadePrimary) {
        Swal.fire({
          icon: 'success',
          title: 'Address Made Primary',
          text: 'Address made primary successfully!',
        }).then(() => {
          location.reload();
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Make Address Primary',
          text: 'Failed to make address primary: ' + response.error,
        });
      }
    },
    error: function (xhr, status, error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error: ' + error,
      });
    }
  });
}

$("#remove-coupon-form").submit((e) => {
  e.preventDefault();

  // Display confirmation dialog
  Swal.fire({
    icon: 'warning',
    title: 'Remove Coupon',
    text: 'Are you sure you want to remove the coupon?',
    showCancelButton: true,
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      // Proceed with removing the coupon
      $.ajax({
        url: '/remove-coupon',
        method: 'post',
        data: $('#remove-coupon-form').serialize(),
        success: (response) => {
          if (response.couponRemoved) {
            Swal.fire({
              icon: 'success',
              title: 'Coupon Removed',
              text: 'Coupon has been removed successfully!',
            }).then(() => {
              location.reload();
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Coupon Removal Error',
              text: 'Error occurred while removing the coupon: ' + response.error,
            });
          }
        },
        error: (error) => {
          console.error('Error occurred while removing the coupon:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error removing the coupon: ' + error,
          }).then(() => {
            location.href="/error-page";
          });
        }
      });
    }
  });
});
