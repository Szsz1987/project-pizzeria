import {select,classNames,templates} from './../settings.js';
import utils from './../utils.js';
import AmountWidget from './AmountWidget.js';

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
          if(optionSelected){ // check if a given image is already selected
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
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
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
    const formData = utils.serializeFormToObject(thisProduct.form);// convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
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

export default Product;
