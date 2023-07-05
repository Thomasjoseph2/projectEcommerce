
 function showAlert(title, text, type) {
  Swal.fire({
    title: title,
    text: text,
    icon: type,
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'OK'
  }).then((result) => {
    if (result.isConfirmed) {
      location.reload();
    }
  });
}


  // Function to confirm the removal of the category
  function confirmRemoveCategory(categoryId, categoryName) {
    Swal.fire({
      title: 'Confirmation',
      text: 'Are you sure you want to remove ' + categoryName + '?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it'
    }).then((result) => {
      if (result.isConfirmed) {
        // Perform AJAX request to remove the category
        $.ajax({
          url: '/admin/remove-category?id=' + categoryId,
          method: 'GET',
          success: function (response) {
            // If the category is successfully removed, update the category table
            $('#categoryTableContainer').load('/admin/category #category-data-table');
            showAlert('Success', 'Category ' + categoryName + ' has been removed.', 'success');
          },
          error: function (error) {
            console.log(error);
          }
        });
      }
    });
  }

  $('.remove-category').on('click', function (event) {
    event.preventDefault();
    var categoryId = $(this).data('category-id');
    var categoryName = $(this).data('category-name');

    Swal.fire({
      title: 'Confirmation',
      text: 'Are you sure you want to remove ' + categoryName + '?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it'
    }).then((result) => {
      if (result.isConfirmed) {
        // Perform AJAX request to check if products exist
        $.ajax({
          url: '/admin/check-products?categoryId=' + categoryId,
          method: 'GET',
          success: function (response) {
            if (response.productExists) {
              // Show the error message in the modal
              $('#errorMessage').text('Category cannot be removed. Products exist in the category.');
              $('#errorModal').modal('show');
            } else {
              // Perform AJAX request to remove the category
              $.ajax({
                url: '/admin/remove-category?id=' + categoryId,
                method: 'GET',
                success: function (response) {
                  // If the category is successfully removed, update the category table
                  $('#categoryTableContainer').load('/admin/category #category-data-table');
                  showAlert('Success', 'Category ' + categoryName + ' has been removed.', 'success');
                  
                },
                error: function (error) {
                  console.log(error);
                }
              });
            }
          },
          error: function (error) {
            console.log(error);
          }
        });
      }
    });
  });

$('#categoryForm').submit(function (event) {
  event.preventDefault();

  // Perform AJAX request to add a new category
  $.ajax({
    url: '/admin/add-category',
    method: 'POST',
    data: $('#categoryForm').serialize(),
    success: function (response) {
      // Reset the form fields
      $('#categoryForm')[0].reset();
      
      // If the category is successfully added, update the category table
      $('#categoryTableContainer').load('/admin/category #category-data-table');
      showAlert('Success', 'Category has been added.', 'success');
    },
    error: function (xhr, status, error) {
      var response = xhr.responseJSON;
      if (response && response.response === "Category already exists") {
        showAlert('Error', 'Category already exists.', 'error');
      } else {
        console.log(error);
        location.reload(); // Refresh the page to restore the original state
      }
    }
  });
});


  $(document).ready(function () {
    $('#offerForm').submit(function (event) {
      event.preventDefault();

      var offerInput = $('#category-offer');
      var offerValue = parseInt(offerInput.val());

      if (offerValue > 100) {
        // Show error message
        offerInput.addClass('is-invalid');
        offerInput.siblings('.invalid-feedback').text('Offer percentage cannot be greater than 100.');
      } else {
        // Perform AJAX request to add the offer
        $.ajax({
          url: '/admin/add-offer',
          method: 'POST',
          data: $('#offerForm').serialize(),
          success: function (response) {
            // Reset the form fields
            $('#offerForm')[0].reset();
            

            // If the offer is successfully added, update the category table
            $('#categoryTableContainer').load('/admin/category #category-data-table');
            showAlert('Success', 'Offer has been added.', 'success');
          },
          error: function (error) {
            console.log(error);
            location.reload(); // Refresh the page to restore the original state
          }
        });
      }
    });

    $('.remove-offer').on('click', function (event) {
      event.preventDefault();
      var categoryId = $(this).data('category-id');
      var categoryName = $(this).data('category-name');

      Swal.fire({
        title: 'Confirmation',
        text: 'Are you sure you want to remove the offer for ' + categoryName + '?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove it'
      }).then((result) => {
        if (result.isConfirmed) {
          // Perform AJAX request to remove the offer
          $.ajax({
            url: '/admin/remove-offer',
            method: 'POST',
            data: { categoryId: categoryId },
            success: function (response) {
              // If the offer is successfully removed, update the category table
              $('#categoryTableContainer').load('/admin/category #category-data-table');
              showAlert('Success', 'Offer for ' + categoryName + ' has been removed.', 'success');
             
            },
            error: function (error) {
              console.log(error);
            }
          });

        }
      });
    });
  });
