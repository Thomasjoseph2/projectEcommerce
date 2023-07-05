 // Get the form and select element
 var form = document.getElementById("statusForm");
 var select = document.getElementById("statusSelect");
 
 // Add an event listener to the form submission
 form.addEventListener("submit", function(event) {
   event.preventDefault(); // Prevent the default form submission
 
   // Create a new XMLHttpRequest object
   var xhr = new XMLHttpRequest();
 
   // Configure the request
   xhr.open("POST", "/admin/admin-order-manage");
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
 
   // Get the selected status value
   var selectedStatus = select.value;
 
   // Create the request body
   var requestBody = "status=" + encodeURIComponent(selectedStatus) + "&orderId=" + encodeURIComponent(this.orderId.value);
 
   // Set up the callback function for when the request completes
   xhr.onload = function() {
     if (xhr.status === 200) {
       // Request was successful
       console.log(xhr.responseText);
      location.href='/admin/order-list';
     } else {
       // Request failed
       console.error("Request failed. Status: " + xhr.status);
     }
   };
 
   // Send the request
   xhr.send(requestBody);
 });