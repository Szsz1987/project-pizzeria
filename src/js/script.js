/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars
{
  'use strict';

  const select = {

    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
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
  }; // const select = {}

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },

    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED

    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
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
      console.log('new Product:', thisProduct);
      //console.log('new Product:', thisProduct);
    }

    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }

    /* generate HTML based on template */
    /* create element using utils.createElementFromHTML */
    /* find menu container */
    /* add element to menu */

    renderInMenu(){
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      const menuContainer =  document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);
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

    /* START: add event listener to accordionTrigger on event click */
    /* prevent default action for event */
    /* find active product (product that has active class) */
    /* if there is active product and it's not thisProduct.element, remove class active from it */
    /* toggle active class on thisProduct.element */


    initAccordion(){
      const thisProduct = this;
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        const activeProduct = document.querySelector(select.all.menuProductsActive);

        if(activeProduct !== null && activeProduct !== thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }

        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
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
      });
    }

    // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    // set price to default price
    // for every category (param)...
    // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'...}
    // for every option in this category
    // determine option value, e.g. optionId = 'olives', option = { labeL: 'Olives', price: 2, default: true}
    // update calculated price in the HTML

    processOrder(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData', formData);
      let price = thisProduct.data.price;

      for(let paramId in thisProduct.data.params){
        const param = thisProduct.data.params[paramId];

        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId);

          if(optionSelected){
            if(!option.default){
              price += option.price; // add price
            }
          } else if(option.default){ // check if the option is default
            price -= option.price; // reduce price
          }

          // find image with class .paramId-optionId
          // check if that image exists at all
          // check if a given image is already selected
          // if yes, give class 'active'
          // if no, remove class 'active'

          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);

          if(optionImage !== null){
            if(optionSelected){
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
    }
  } // brace for class product

  class AmountWidget {
    constructor(element){ // element is reference to DOM, like thisProduct.amountWidgetElem
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
      console.log('AmountWidget', AmountWidget);
      console.log('constructor arguments', element);
      console.log(thisWidget.input);
      console.log(thisWidget.value);
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
      // check that new value is not default, is not text and is between 1 and 10

      if(
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
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }
  } // class AmountWidget {}

  class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('new Cart', thisCart);
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    }

    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }
  }

  const app = {

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
    },

    initMenu: function(){
      const thisApp = this;
      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initCart: function(){
      const thisApp = this;
      const cartElement = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElement); // here will be save instance from class Cart
    },

    init: function(){
      const thisApp = this;
      //console.log('*** App starting ***');
      //console.log('thisApp:', thisApp);
      //console.log('classNames:', classNames);
      //console.log('settings:', settings);
      //console.log('templates:', templates);
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };
  app.init();
}
