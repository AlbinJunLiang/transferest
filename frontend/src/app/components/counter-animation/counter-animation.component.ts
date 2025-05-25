import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { TokenService } from '../../services/token.service';


/**
 * Componente para mostrar el contador o efecto de contador de saldo
 */
@Component({
  selector: 'app-counter-animation',
  standalone: true,
  imports: [],
  templateUrl: './counter-animation.component.html',
  styleUrl: './counter-animation.component.scss'
})
export class CounterAnimationComponent {
  @ViewChild('counter', { static: true }) counter!: ElementRef;
  @ViewChild('floatingChange', { static: true }) floatingChange!: ElementRef;
  private accountService = inject(AccountService);
  private tokenService = inject(TokenService);
  currentValue = 0; // Para representar el saldo actual
  error = '';

  ngOnInit(): void {
    const phoneNumber = this.tokenService.decodeToken().phoneNumber;
    this.accountService.getBalance(phoneNumber).subscribe({
      next: (res) => {
        if (res.success) {
          this.currentValue = parseFloat(res.balance);
        } else {
          this.error = 'No se pudo obtener el balance.';
        }
      },
      error: () => {
        this.error = 'Ocurrió un error al consultar el balance.';
      }
    });
  }


  updateValue(newValue: number, addedAmount: number = 0): void {
    const counterEl = this.counter.nativeElement;
    const floatEl = this.floatingChange.nativeElement;

    // Formatear a 3 decimales
    const formattedNewValue = newValue.toFixed(3);
    const formattedAddedAmount = Math.abs(addedAmount).toFixed(3);

    // Actualizar el valor
    counterEl.textContent = newValue < 0
      ? `-$${formattedNewValue}`
      : `$${formattedNewValue}`;

    // Resetear clases
    counterEl.classList.remove('positive', 'negative');
    floatEl.classList.remove('positive', 'negative', 'show');

    // Colores principales
    if (newValue >= 0) {
      counterEl.classList.add('positive');
    } else {
      counterEl.classList.add('negative');
    }

    // Mostrar flotante solo si se agregó un monto
    if (addedAmount !== 0) {
      floatEl.textContent = `${addedAmount > 0 ? '+' : '-'}$${formattedAddedAmount}`;
      floatEl.classList.add(addedAmount > 0 ? 'positive' : 'negative', 'show');

      setTimeout(() => {
        floatEl.classList.remove('show');
      }, 800);
    }
  }


  animateChange(amount: number): void {
    const target = this.currentValue + amount;
    const duration = 800;
    const start = this.currentValue;
    const increment = (target - start) / (duration / 16);

    const animate = () => {
      this.currentValue += increment;

      const isComplete = amount > 0
        ? this.currentValue >= target
        : this.currentValue <= target;

      if (!isComplete) {
        this.updateValue(Math.floor(this.currentValue), amount);
        requestAnimationFrame(animate);
      } else {
        this.currentValue = target;
        this.updateValue(target, amount);
      }
    };

    animate();
  }

}