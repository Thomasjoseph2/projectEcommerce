// Get references to the form and form fields
const form = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('Email');
const phoneNumberInput = document.getElementById('phoneNumber');
const passwordInput = document.getElementById('Password');

// Get references to the error message elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const phoneNumberError = document.getElementById('phoneNumberError');
const passwordError = document.getElementById('passwordError');

// Add an event listener to the form on submit
form.addEventListener('submit', function(event) {
  // Prevent the form from submitting by default
  event.preventDefault();

  // Perform form validation
  if (validateForm()) {
    // If the form is valid, submit the form
    form.submit();
  }
});

// Function to validate the form
function validateForm() {
  // Get the values from the form fields
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phoneNumber = phoneNumberInput.value.trim();
  const password = passwordInput.value.trim();

  // Clear previous error messages
  nameError.textContent = '';
  emailError.textContent = '';
  phoneNumberError.textContent = '';
  passwordError.textContent = '';

  // Perform individual field validations
  let isValid = true;

  if (name === '') {
    nameError.textContent = 'Please enter your full name.';
    isValid = false;
  }

  if (email === '') {
    emailError.textContent = 'Please enter your email address.';
    isValid = false;
  }

  if (phoneNumber === '') {
    phoneNumberError.textContent = 'Please enter your phone number.';
    isValid = false;
  } else if (!isValidPhoneNumber(phoneNumber)) {
    phoneNumberError.textContent = 'Please enter a valid phone number.';
    isValid = false;
  }

  if (password === '') {
    passwordError.textContent = 'Please enter your password.';
    isValid = false;
  }

  // You can add more validations as needed

  return isValid; // Return true if all validations pass
}

// Function to validate the phone number format
function isValidPhoneNumber(phoneNumber) {
  // Regular expression to match a valid phone number format
  const phoneRegex = /^[+]\d{1,3}\s?\d{3}\s?\d{3}\s?\d{4}$/;

  // Test the phone number against the regex
  return phoneRegex.test(phoneNumber);
}