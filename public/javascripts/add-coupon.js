function validateForm() {
    var couponCodeInput = document.getElementById('coupon-code');
    var purchaseAmountInput = document.getElementById('purchase-amount');
    var expiryInput = document.getElementById('expiry');
    var discountInput = document.getElementById('discount');
    
    // Reset error messages
    document.getElementById('coupon-code-error').textContent = '';
    document.getElementById('purchase-amount-error').textContent = '';
    document.getElementById('expiry-error').textContent = '';
    document.getElementById('discount-error').textContent = '';
    
    // Validate coupon code
    if (couponCodeInput.value.trim() === '') {
      document.getElementById('coupon-code-error').textContent = 'Coupon Code is required';
      return false;
    }
    
    // Validate purchase amount
    if (purchaseAmountInput.value.trim() === '') {
      document.getElementById('purchase-amount-error').textContent = 'Purchase Amount is required';
      return false;
    }
    
    // Validate expiry
    if (expiryInput.value.trim() === '') {
      document.getElementById('expiry-error').textContent = 'Expiry is required';
      return false;
    }
    
    // Validate discount
    if (discountInput.value.trim() === '') {
      document.getElementById('discount-error').textContent = 'Discount is required';
      return false;
    }
    
    return true;
  }