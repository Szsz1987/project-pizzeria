/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars
{
  'use strict';

  const select = {

    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },

    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },

    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },

    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },

    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },

    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },

    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },

    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },

    cart: {
      defaultDeliveryFee: 20,
    },

    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    constructor(id, data){
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }

    renderInMenu(){
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data); /* generate HTML based on template */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML); /* create element using utils.createElementFromHTML */
      const menuContainer =  document.querySelector(select.containerOf.menu); /* find menu container */
      menuContainer.appendChild(thisProduct.element); /* add element to menu */
    }

    getElements(){
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion(){
      const thisProduct = this;
      thisProduct.accordionTrigger.addEventListener('click', function(event) { /* START: add event listener to accordionTrigger on event click */
        event.preventDefault(); /* prevent default action for event */
        const activeProduct = document.querySelector(select.all.menuProductsActive); /* find active product (product that has active class) */
        if(activeProduct !== null && activeProduct !== thisProduct.element){ /* if there is active product and it's not thisProduct.element, remove class active from it */
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);  /* toggle active class on thisProduct.element */
      });
    }

    initOrderForm(){
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form); // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      let price = thisProduct.data.price; // set price to default price
      for(let paramId in thisProduct.data.params){ // for every category (param)...
        const param = thisProduct.data.params[paramId]; // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'...}
        for(let optionId in param.options) { // for every option in this category
          const option = param.options[optionId]; // determine option value, e.g. optionId = 'olives', option = { labeL: 'Olives', price: 2, default: true}
          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId); // update calculated price in the HTML

          if(optionSelected){
            if(!option.default){
              price += option.price; // add price
            }
          } else if(option.default){ // check if the option is default
            price -= option.price; // reduce price
          }

          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId); // find image with class .paramId-optionId
          if(optionImage !== null){ // check if that image exists at all
            if(optionSelected){   // check if a given image is already selected
              optionImage.classList.add(classNames.menuProduct.imageVisible); // if yes, give class 'active'
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible); // if no, remove class 'active'
            }
          }
        }
      }

      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value; //multiply price by amount
      thisProduct.priceMulti = price;
      thisProduct.priceElem.innerHTML = price;
    }

    addToCart(){
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct(){
      const thisProduct = this;
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceMulti,
        params: thisProduct.prepareCartProductParams()
      };
      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form); // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const params = {};
      for(let paramId in thisProduct.data.params){ // for every category (param)...
        const param = thisProduct.data.params[paramId]; // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'...}

        params[paramId] = { // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
          label: param.label,
          options: {}
        };
        for(let optionId in param.options) { // for every option in this category
          const option = param.options[optionId]; // determine option value, e.g. optionId = 'olives', option = { labeL: 'Olives', price: 2, default: true}
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected){
            params[paramId].options[optionId] = option.label; //check if there is param with a name of paramId in formData and if it includes optionId
          }
        }
      }
      return params;
    }
  } // class Product

  class AmountWidget {
    constructor(element){ // element is reference to DOM, like thisProduct.amountWidgetElem
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      if( // check that new value is not default, is not text and is between 1 and 10
        thisWidget.value !== newValue &&
        !isNaN(newValue) &&
        newValue <= 10 &&
        newValue >= 0
      ){
        thisWidget.value = newValue;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value-1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value+1);
      });
    }

    announce(){
      const thisWidget = this;
      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  } // class AmountWidget

  class Cart{ // basket
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form); // reference to the form
      thisCart.dom.formAdress = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.formPhone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    }

    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    add(menuProduct){
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
    }

    update(){
      const thisCart = this;
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      for(let product of thisCart.products){
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }
      if(thisCart.totalNumber > 0){
        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      }
      else {
        thisCart.totalPrice = 0;
        thisCart.deliveryFee = 0;
      }
      thisCart.dom.subTotalPrice.innerHTML = thisCart.subtotalPrice;
      for(let price of thisCart.dom.totalPrice){
        price.innerHTML = thisCart.totalPrice;
      }
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    }

    remove(cartProduct){
      const thisCart = this;
      const index = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(index, 1);
      cartProduct.dom.wrapper.remove();
      thisCart.update();
    }

    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.order; // we will get http://localhost:3131/order
      const payload = {
        address: thisCart.dom.formAdress.value,
        phone: thisCart.dom.formPhone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: []
      };
      //console.log('payload', payload);
      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options);
    }
  } // class Cart

  class CartProduct { // products in the basket
    constructor(menuProduct, element){
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    getData(){
      const thisCartProduct = this;
      // console.log('thisCartProduct', thisCartProduct);
      const formProduct = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: thisCartProduct.params,
      };
      // console.log('formProduct', formProduct);
      return formProduct;
    }

    remove(){
      const thisCartProduct = this;
      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions(){
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
  } // class CartProduct

  const app = {

    initData: function(){
      const thisApp = this;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          // console.log('parsedResponse', parsedResponse);
          thisApp.data.products = parsedResponse; // save parsedResponse as thisApp.data.products
          thisApp.initMenu(); // execute initMenu method
        });
      // console.log('thisApp.data', JSON.stringify(thisApp.data));
    },

    initMenu: function(){
      const thisApp = this;
      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initCart: function(){
      const thisApp = this;
      const cartElement = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElement); // here will be save instance from class Cart
    },

    init: function(){
      const thisApp = this;
      thisApp.initData();
      thisApp.initCart();
    },
  };
  app.init();
}
