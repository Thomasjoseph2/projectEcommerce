// Get references to the form and form fields
const form = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('Email');
const phoneNumberInput = document.getElementById('phoneNumber');
const passwordInput = document.getElementById('Password');
const confirmPasswordInput = document.getElementById('confirmpassword');

// Get references to the error message elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const phoneNumberError = document.getElementById('phoneNumberError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');

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
  const confirmPassword = confirmPasswordInput.value.trim();

  // Clear previous error messages
  nameError.textContent = '';
  emailError.textContent = '';
  phoneNumberError.textContent = '';
  passwordError.textContent = '';
  confirmPasswordError.textContent = '';

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

  if (confirmPassword === '') {
    confirmPasswordError.textContent = 'Please confirm your password.';
    isValid = false;
  } else if (password !== confirmPassword) {
    confirmPasswordError.textContent = 'Passwords do not match.';
    isValid = false;
  }

  // Validate the password strength
  if (!isValidPassword(password)) {
    passwordError.textContent = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
    isValid = false;
  }

  return isValid; // Return true if all validations pass
}

// Function to validate the phone number format
function isValidPhoneNumber(phoneNumber) {
  // Regular expression to match a valid phone number format
  const phoneRegex = /^[+]\d{1,3}\s?\d{3}\s?\d{3}\s?\d{4}$/;

  // Test the phone number against the regex
  return phoneRegex.test(phoneNumber);
}

// Function to validate the password strength
function isValidPassword(password) {
  // Regular expression to match a strong password format (8 characters with both capital and small letters)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Test the password against the regex
  return passwordRegex.test(password);
}
