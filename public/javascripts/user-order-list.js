
function cancelOrder(orderId) {
    // Display a confirmation dialog to the user
    Swal.fire({
      icon: 'question',
      title: 'Confirm Cancel',
      text: 'Are you sure you want to cancel this order?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        // Ask for the cancel reason if the user confirms
        askForCancelReason(orderId);
      }
    });
  }
  function askForCancelReason(orderId) {
    Swal.fire({
      icon: 'question',
      title: 'Cancel Reason',
      text: 'Please provide a reason for canceling this order:',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // If the user provided a reason, proceed with the cancel request
        sendCancelRequest(orderId, result.value);
      }
    });
  }
  
  function sendCancelRequest(orderId, reason) {
    // AJAX Function for cancelling an order with reason
    $.ajax({
      url: '/cancel-order',
      data: {
        orderId: orderId,
        reason: reason
      },
      method: 'post',
      success: (response) => {
        if (response.cancelrequest) {
          Swal.fire({
            icon: 'success',
            title: 'Order Request Sent',
            text: 'Cancel request sent successfully!',
          }).then(() => {
            location.reload();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Cancel Request Failed',
            text: 'Some errors occurred while cancelling the order.',
          });
        }
      }
    });
  }
  function returnOrder(orderId) {
    // Display a confirmation dialog to the user
    Swal.fire({
      icon: 'question',
      title: 'Confirm Return',
      text: 'Are you sure you want to return this order?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        // Ask for the return reason if the user confirms
        askForReturnReason(orderId);
      }
    });
  }
  function askForReturnReason(orderId) {
    Swal.fire({
      icon: 'question',
      title: 'Return Reason',
      text: 'Please provide a reason for returning this order:',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // If the user provided a reason, proceed with the return request
        sendReturnRequest(orderId, result.value);
      }
    });
  }
  
  function sendReturnRequest(orderId, reason) {
    // AJAX Function for returning an order with reason
    $.ajax({
      url: '/return-order',
      data: {
        orderId: orderId,
        reason: reason
      },
      method: 'post',
      success: (response) => {
        if (response.returnrequest) {
          Swal.fire({
            icon: 'success',
            title: 'Order Request Sent',
            text: 'Return request sent successfully!',
          }).then(() => {
            location.reload();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Return Request Failed',
            text: 'Some errors occurred while returning the order.',
          });
        }
      }
    });
  }