if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}


function ready() {
    var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem)
    }

    var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i]
        input.addEventListener('change', quantityChanged)
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
}

function purchaseClicked() {
    const data = document.querySelector('.btn-purchase').getAttribute('data-order')
    fetch('/payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data,
    })
        .then(response => response.json())
        .then(data => {
            var cartItems = document.getElementsByClassName('cart-items')[0]
            while (cartItems.hasChildNodes()) {
                cartItems.removeChild(cartItems.firstChild)
            }
            updateCartTotal()
            window.open(`/payment/${data.order_id}`);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}  

function removeCartItem(event) {
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}

function quantityChanged(event) {
    var input = event.target
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1
    }
    updateCartTotal()
}

function addToCartClicked(event) {
    var button = event.target
    var shopItem = button.parentElement.parentElement
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    addItemToCart(title, price, imageSrc)
    updateCartTotal()
}

function addItemToCart(title, price, imageSrc) {
    var cartRow = document.createElement('div')
    cartRow.classList.add('cart-row')
    var cartItems = document.getElementsByClassName('cart-items')[0]
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            alert('This item is already added to the cart')
            return
        }
    }
    var cartRowContents = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-price cart-column">${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" type="button">REMOVE</button>
        </div>`
    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged)
}

function modifyOrderPayload (orderData) {
    const modifiedItems = orderData.orderItems.map(item => {
        return {
            "type": "physical",
            "reference": item.itemName,
            "name": item.itemName,
            "quantity": item.quantity,
            "quantity_unit": "pcs",
            "unit_price": item.price * 100,
            "tax_rate": 0,
            "total_amount": (item.quantity * item.price) * 100,
            "total_discount_amount": 0,
            "total_tax_amount": 0
        }
    })
    const payload = {
        "purchase_country": "SE",
        "purchase_currency": "SEK",
        "locale": "en-SW",
        "order_amount": orderData.total * 100,
        "order_tax_amount": 0,
        "order_lines": modifiedItems,
        "merchant_urls": {
            "terms": "https://tweakcast.herokuapp.com/terms.html",
            "checkout": "https://tweakcast.herokuapp.com/checkout.html",
            "confirmation": "https://tweakcast.herokuapp.com/confirmation?klarna_order_id={checkout.order.id}",
            "push": "https://tweakcast.herokuapp.com/api/push"
        }
    }
    document.querySelector('.btn-purchase').setAttribute('data-order' , JSON.stringify(payload));

}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0
    const orderData = {total: 0, orderItems: []}
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var itemName = cartRow.getElementsByClassName('cart-item-title')[0].innerHTML
        var priceElement = cartRow.getElementsByClassName('cart-price')[0]
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        var price = parseFloat(priceElement.innerText.replace('$', ''))
        var quantity = parseFloat(quantityElement.value)
        total = total + (price * quantity)
        orderData.orderItems.push({
            itemName,
            quantity,
            price
        })        
    }
    total = Math.round(total * 100) / 100
    orderData.total = total
    modifyOrderPayload (orderData)
    document.getElementsByClassName('cart-total-price')[0].innerText = 'Sek' + total
}
