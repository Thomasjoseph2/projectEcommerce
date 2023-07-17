
  function viewImage(event) {
    document.getElementById('product-image').src = URL.createObjectURL(event.target.files[0]);
  }

  function validateForm() {
    var productNameInput = document.getElementById('product-name');
    var productDescriptionInput = document.getElementById('product-description');
    var productPriceInput = document.getElementById('product-price');
    var productCategoryInput = document.getElementById('product-category');
    var productImageInput = document.getElementById('product-image');
    var productQuantityInput=document.getElementById('product-quantity')

    // Reset error messages
    document.getElementById('product-name-error').textContent = '';
    document.getElementById('product-description-error').textContent = '';
    document.getElementById('product-price-error').textContent = '';
    document.getElementById('product-category-error').textContent = '';
    document.getElementById('product-image-error').textContent = '';
    document.getElementById('product-quantity-error').textContent = '';

    // Validate product name
    if (productNameInput.value.trim() === '') {
      document.getElementById('product-name-error').textContent = 'Product Name is required';
      return false;
    }
    if (productNameInput.value.trim().length > 25) {
      document.getElementById('product-name-error').textContent = 'Product Name should be at most 25 characters';
      return false;
    }

    // Validate product description
    if (productDescriptionInput.value.trim() === '') {
      document.getElementById('product-description-error').textContent = 'Product Description is required';
      return false;
    }

    // Validate product price
    if (productPriceInput.value.trim() === '') {
      document.getElementById('product-price-error').textContent = 'Product Price is required';
      return false;
    }
    if (parseFloat(productPriceInput.value) < 0) {
      document.getElementById('product-price-error').textContent = 'Product Price cannot be negative';
      return false;
    }
      // Validate product Quantity
      if (productQuantityInput.value.trim() === '') {
        document.getElementById('product-quantity-error').textContent = 'Product Quantity is required';
        return false;
      }
      if (parseFloat(productQuantityInput.value) < 0) {
        document.getElementById('product-quantity-error').textContent = 'Product Quantity cannot be negative';
        return false;
      }

    // Validate product category
    if (productCategoryInput.value.trim() === '') {
      document.getElementById('product-category-error').textContent = 'Category is required';
      return false;
    }

    // Validate product image
    if (productImageInput.value.trim() === '') {
      document.getElementById('product-image-error').textContent = 'Product Image is required';
      return false;
    }

    return true; // Allow form submission
  }

