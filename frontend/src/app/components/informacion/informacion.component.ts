import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
/**
 * Componente para mostrar detalles informativos de la app
 */
@Component({
  selector: 'app-informacion',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatFormFieldModule
    ,MatCardModule, MatIconModule
  ],
  templateUrl: './informacion.component.html',
  styleUrl: './informacion.component.scss'
})
export class InformacionComponent {
    private builder = inject(FormBuilder);
  
  frmEdit: FormGroup;

  constructor() {

    this.frmEdit = this.builder.group({
        receiver: null
    });

  }

}
