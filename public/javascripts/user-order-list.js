
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
                // AJAX Function for cancelling an order
                $.ajax({
                    url: '/cancel-order',
                    data: {
                        orderId: orderId,
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.cancelrequest) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Order request send',
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
                // AJAX Function for returning an order
                $.ajax({
                    url: '/return-order',
                    data: {
                        orderId: orderId,
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.returnrequest) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Order Returned',
                                text: 'Return request sent successfully!',
                            }).then(() => {
                                location.reload();
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Return Request Failed',
                                text: 'Some errors occurred while returning the order.',
                            }).then(() => {
                                location.reload();
                            });
                        }
                    }
                });
            }
        });
    }

