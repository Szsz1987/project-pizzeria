import {templates, select} from '../settings.js';
import Carousel from './carousel.js';

class Home{
  constructor(element){
    const thisHome = this;
    thisHome.render(element);
    thisHome.initWidgets();
  }

  render(element){
    const thisHome = this;
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    const generatedHTML = templates.homeSite();
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.dom.carouselWidget = thisHome.dom.wrapper.querySelector(select.widgets.carousel.wrapper);
  }

  initWidgets(){
    const thisHome = this;
    thisHome.carouselWidget = new Carousel(thisHome.dom.carouselWidget);
  }
}

export default Home;
