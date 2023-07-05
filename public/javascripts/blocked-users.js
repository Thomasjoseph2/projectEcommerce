
        $(document).ready(function() {
            $('#usersTable').DataTable();
        });
        $(document).ready(function() {
  $('.unblock-user').on('click', function(event) {
    event.preventDefault();
    var userId = $(this).attr('href');
    var userName = $(this).data('name');

    Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to unblock ' + userName + '?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, unblock',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Redirect to the unblock URL
        window.location.href = userId;
      }
    });
  });
});

