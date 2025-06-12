document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const productSearch = document.getElementById('productSearch');
    const productList = document.getElementById('productList');
    const cartItems = document.getElementById('cartItems');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const taxAmount = document.getElementById('taxAmount');
    const totalAmount = document.getElementById('totalAmount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const scanQRBtn = document.getElementById('scanQRBtn');
    const barcodeInput = document.getElementById('barcodeInput');
    const printBillBtn = document.getElementById('printBillBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const paymentMode = document.getElementById('paymentMode');
    const printPaymentMode = document.getElementById('printPaymentMode');
    const receiptDate = document.getElementById('receiptDate');

    // Cart array to store items
    let cart = [];

    // Tax rate (5%)
    const TAX_RATE = 0.05;

    // Initialize receipt date
    updateReceiptDate();

    function updateReceiptDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        receiptDate.textContent = now.toLocaleDateString('en-IN', options);
    }

    // Update print payment mode when selection changes
    paymentMode.addEventListener('change', function() {
        printPaymentMode.textContent = this.options[this.selectedIndex].text;
    });

    // Product search functionality
    productSearch.addEventListener('input', debounce(function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length > 1) {
            fetchWithErrorHandling(`/api/products?search=${encodeURIComponent(searchTerm)}`, 
                'Error searching products')
                .then(products => {
                    productList.innerHTML = '';
                    if (products && products.length > 0) {
                        productList.classList.remove('hidden');
                        products.forEach(product => {
                            const li = document.createElement('li');
                            li.className = 'p-2 hover:bg-gray-100 cursor-pointer';
                            li.textContent = `${product.name} - ₹${product.price.toFixed(2)}`;
                            if (product.stock <= 5) {
                                li.textContent += ` (Only ${product.stock} left)`;
                                li.className += ' text-red-600';
                            }
                            li.dataset.productId = product.id;
                            li.addEventListener('click', () => addToCart(product));
                            productList.appendChild(li);
                        });
                    } else {
                        productList.classList.add('hidden');
                    }
                })
                .catch(() => productList.classList.add('hidden'));
        } else {
            productList.innerHTML = '';
            productList.classList.add('hidden');
        }
    }, 300));

    // Barcode scanning functionality
    scanQRBtn.addEventListener('click', function() {
        barcodeInput.classList.toggle('hidden');
        if (!barcodeInput.classList.contains('hidden')) {
            barcodeInput.focus();
        }
    });

    barcodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const barcode = this.value.trim();
            if (barcode) {
                fetchWithErrorHandling(`/api/products?barcode=${barcode}`, 'Product not found')
                    .then(product => {
                        if (product) {
                            addToCart(product);
                            this.value = '';
                            this.classList.add('hidden');
                        } else {
                            alert('Product not found');
                        }
                    });
            }
        }
    });

    // Cart functionality
    function addToCart(product) {
        if (!product || product.stock <= 0) {
            alert('Product out of stock');
            return;
        }

        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                alert(`Only ${product.stock} items available in stock`);
                return;
            }
            existingItem.quantity++;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                maxStock: product.stock
            });
        }
        
        renderCart();
        productSearch.value = '';
        productList.innerHTML = '';
        productList.classList.add('hidden');
    }

    function renderCart() {
        cartItems.innerHTML = '';
        let subtotal = 0;
        
        if (cart.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="py-4 text-center text-gray-500">Your cart is empty</td>';
            cartItems.appendChild(emptyRow);
            
            subtotalAmount.textContent = '₹0.00';
            taxAmount.textContent = '₹0.00';
            totalAmount.textContent = '₹0.00';
            return;
        }
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const tr = document.createElement('tr');
            tr.className = 'bill-item';
            tr.innerHTML = `
                <td class="py-2">${item.name}</td>
                <td class="py-2 text-center">
                    <input type="number" min="1" max="${item.maxStock}" value="${item.quantity}" 
                           class="w-16 border rounded px-2 quantity-input" 
                           data-index="${index}">
                </td>
                <td class="py-2 text-right">₹${item.price.toFixed(2)}</td>
                <td class="py-2 text-right">₹${itemTotal.toFixed(2)}</td>
                <td class="py-2 text-center">
                    <button class="text-red-500 remove-item text-xl" data-index="${index}">×</button>
                </td>
            `;
            cartItems.appendChild(tr);
        });
        
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;
        
        subtotalAmount.textContent = `₹${subtotal.toFixed(2)}`;
        taxAmount.textContent = `₹${tax.toFixed(2)}`;
        totalAmount.textContent = `₹${total.toFixed(2)}`;
        
        // Add event listeners to quantity inputs
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                const newQuantity = parseInt(this.value);
                
                if (isNaN(newQuantity)) {
                    this.value = cart[index].quantity;
                    return;
                }
                
                if (newQuantity < 1) {
                    this.value = 1;
                    cart[index].quantity = 1;
                } else if (newQuantity > cart[index].maxStock) {
                    alert(`Only ${cart[index].maxStock} items available in stock`);
                    this.value = cart[index].quantity;
                    return;
                } else {
                    cart[index].quantity = newQuantity;
                }
                
                renderCart();
            });
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                cart.splice(index, 1);
                renderCart();
            });
        });
    }

    // Checkout functionality
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Please add items to cart');
            return;
        }
        
        const paymentModeValue = paymentMode.value;
        if (!paymentModeValue) {
            alert('Please select a payment mode');
            return;
        }
        
        const subtotal = parseFloat(subtotalAmount.textContent.replace('₹', ''));
        const tax = parseFloat(taxAmount.textContent.replace('₹', ''));
        const total = parseFloat(totalAmount.textContent.replace('₹', ''));
        
        const data = {
            items: cart.map(item => ({
                id: item.id,
                price: item.price,
                quantity: item.quantity
            })),
            total: total,
            payment_mode: paymentModeValue
        };
        
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';
        
        fetchWithErrorHandling('/api/sale', 'Error processing sale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.success) {
                throw new Error(response.error || 'Unknown error occurred');
            }
            return response;
        })
        .then(data => {
            const receiptData = {
                id: data.sale_id,
                date: new Date(),
                items: cart.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                subtotal: subtotal,
                tax: tax,
                total_amount: total,
                payment_mode: paymentMode.options[paymentMode.selectedIndex].text
            };
            
            generateAndPrintReceipt(receiptData);
            cart = [];
            renderCart();
            updateReceiptDate();
        })
        .catch(error => {
            console.error('Checkout error:', error);
            alert('Failed to process sale: ' + error.message);
        })
        .finally(() => {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Checkout';
        });
    });

    // Print bill functionality
    printBillBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('No items in cart to print');
            return;
        }

        const subtotal = parseFloat(subtotalAmount.textContent.replace('₹', ''));
        const tax = parseFloat(taxAmount.textContent.replace('₹', ''));
        const total = parseFloat(totalAmount.textContent.replace('₹', ''));

        const printContent = generateReceiptContent({
            id: 'DRAFT',
            date: new Date(),
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: subtotal,
            tax: tax,
            total_amount: total,
            payment_mode: printPaymentMode.textContent
        });

        openPrintWindow(printContent, 'Sahjanand Mart - Draft Bill');
    });

    // Clear cart functionality
    clearCartBtn.addEventListener('click', function() {
        if (cart.length === 0) return;
        
        if (confirm('Are you sure you want to clear the cart?')) {
            cart = [];
            renderCart();
        }
    });

    // Helper functions
    function fetchWithErrorHandling(url, errorMessage, options) {
        return fetch(url, options)
            .then(async response => {
                if (!response.ok) {
                    let errorDetails = '';
                    try {
                        const errorResponse = await response.json();
                        errorDetails = errorResponse.error || response.statusText;
                    } catch (e) {
                        errorDetails = response.statusText;
                    }
                    
                    const error = new Error(`${errorMessage}: ${response.status} ${errorDetails}`);
                    error.response = response;
                    throw error;
                }
                return response.json();
            })
            .catch(error => {
                console.error('API Error:', error);
                alert(error.message);
                throw error;
            });
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function generateAndPrintReceipt(saleData) {
        const printContent = generateReceiptContent(saleData);
        openPrintWindow(printContent, `Sahjanand Mart - Bill #${saleData.id}`);
    }

    function generateReceiptContent(sale) {
        return `
            <div class="p-4 text-center">
                <h1 class="text-2xl font-bold">Sahjanand Mart</h1>
                <p class="text-sm">Nr. Sahjanand Parlour, Bakrol - Vadtal Road</p>
                <p class="text-sm">Jol- 388315, Anand, Gujarat</p>
                <p class="text-sm">GSTIN: 22ABCDE1234F1Z5</p>
                <hr class="my-2 border-black">
                <div class="text-left mb-2">
                    <div>Bill No: ${sale.id}</div>
                    <div>Date: ${new Date(sale.date).toLocaleString('en-IN')}</div>
                </div>
                <table class="w-full mt-2">
                    <thead>
                        <tr class="border-b border-gray-300">
                            <th class="text-left py-1">Item</th>
                            <th class="text-center py-1">Qty</th>
                            <th class="text-right py-1">Price</th>
                            <th class="text-right py-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map(item => `
                            <tr class="border-b border-gray-100">
                                <td class="py-1">${item.name}</td>
                                <td class="text-center py-1">${item.quantity}</td>
                                <td class="text-right py-1">₹${item.price.toFixed(2)}</td>
                                <td class="text-right py-1">₹${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <hr class="my-2 border-black">
                <div class="text-right">
                    <div class="mb-1">Subtotal: ₹${sale.subtotal.toFixed(2)}</div>
                    <div class="mb-1">Tax (5%): ₹${sale.tax.toFixed(2)}</div>
                    <div class="font-bold">Total: ₹${sale.total_amount.toFixed(2)}</div>
                </div>
                <div class="mt-2 text-left">
                    <span class="font-medium">Payment Mode: </span>
                    <span>${sale.payment_mode}</span>
                </div>
                <div class="mt-4 font-bold">Thank you for shopping with us!</div>
            </div>
        `;
    }

    function openPrintWindow(content, title) {
        try {
            const printWindow = window.open('', '_blank', 'width=600,height=600');
            if (!printWindow) {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }
            
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
                            table { width: 100%; border-collapse: collapse; }
                            th { text-align: left; font-weight: bold; }
                            hr { border-top: 1px dashed #000; }
                            .text-right { text-align: right; }
                            .text-center { text-align: center; }
                            @media print {
                                body { padding: 0; }
                                @page { margin: 5mm; }
                            }
                        </style>
                    </head>
                    <body>
                        ${content}
                        <script>
                            window.onload = function() {
                                setTimeout(function() {
                                    window.print();
                                    window.close();
                                }, 200);
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Print error:', error);
            alert('Could not open print window. ' + error.message);
        }
    }
});