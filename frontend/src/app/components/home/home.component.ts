import { Component, OnInit } from '@angular/core';
/**
 * Componente para mostrar el carusel de imagenes
 */

interface Image {
  url: string;
  alt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})



export class HomeComponent implements OnInit {


  images: Image[] = [
    { url: 'https://live.staticflickr.com/65535/54511286372_a5cc44aca7_k.jpg', alt: 'Imagen 1' },
    { url: 'https://live.staticflickr.com/65535/54512340389_58b4a060a2_k.jpg', alt: 'Imagen 2' },
    { url: 'https://live.staticflickr.com/65535/54512151636_c792573601_k.jpg', alt: 'Imagen 3' },
  ];
  currentSlideIndex = 0;
  interval: any;

  ngOnInit() {
    this.startCarousel();
  }

  startCarousel() {
    this.interval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Cambia de imagen cada 5 segundos (5000 ms)
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.images.length;
  }

  prevSlide() {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.images.length) % this.images.length;
  }

  /**Obtiene la posicion del siguiente slide
   * 
   * @returns 
   */
  nextSlideIndex() {
    return (this.currentSlideIndex + 1) % this.images.length;
  }

  ngOnDestroy() {
    clearInterval(this.interval); // Limpia el intervalo al destruir el componente
  }
}
