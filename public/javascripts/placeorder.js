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
    $.ajax({
      url: '/place-order',
      method: 'post',
      data: $('#checkout-form').serialize(),
      success: (response) => {
          
        if (response.codStatus) {
          location.href = '/order-success'; // Redirect to order success page for COD payment
        } else if (response.walletStatus) {
          location.href = '/order-success'; // Redirect to order success page for Wallet payment
        }else if (response.walletStatus===false) {
          alert("not enough wallet money")
          location.href = '/order-list'; // Redirect to order success page for Wallet payment
        } else {
          razorpayPayment(response); // Proceed with Razorpay payment
        }
      }
    });
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