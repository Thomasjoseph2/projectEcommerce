document.getElementById('statusForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission
    
    var form = event.target;
    var formData = new FormData(form);
  
    fetch('/admin/admin-order-manage', {
      method: 'POST',
      body: formData
    })
    .then(function(response) {
      if (response.ok) {
        // Reload the page after successful status update
        location.reload();
      } else {
        throw new Error('Error updating status');
      }
    })
    .catch(function(error) {
      console.error(error);
      // Handle error here (e.g., show error message to the user)
    });
  });