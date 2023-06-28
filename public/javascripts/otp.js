document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();
    validatePhoneNumber();
  });

  document.getElementById('verifyOtpForm').addEventListener('submit', function(event) {
    event.preventDefault();
    validateOTP();
  });

  function validatePhoneNumber() {
    const phoneNumberInput = document.getElementById('phoneNumber');
    const phoneNumberError = document.getElementById('phoneNumberError');

    const phoneNumber = phoneNumberInput.value.trim();

    phoneNumberError.textContent = '';

    if (phoneNumber === '') {
      phoneNumberError.textContent = 'Please enter your phone number.';
    } else if (!isValidPhoneNumber(phoneNumber)) {
      phoneNumberError.textContent = 'Please enter a valid phone number.';
    } else {
      // If the phone number is valid, submit the form
      document.getElementById('contactForm').submit();
    }
  }

  function validateOTP() {
    const otpInput = document.getElementById('otp');
    const otpError = document.getElementById('otpError');

    const otp = otpInput.value.trim();

    otpError.textContent = '';

    if (otp === '') {
      otpError.textContent = 'Please enter the OTP.';
    } else {
      // If the OTP is provided, submit the form
      document.getElementById('verifyOtpForm').submit();
    }
  }

  function isValidPhoneNumber(phoneNumber) {
    // Regular expression to match a valid phone number format
    const phoneRegex = /^\d{10}$/;

    // Test the phone number against the regex
    return phoneRegex.test(phoneNumber);
  }