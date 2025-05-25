import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  constructor(
    public dialogRef: MatDialogRef<MessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    // Los datos pasados al diálogo estarán disponibles en 'this.data'
    if (this.data.showCancelButton === undefined) {
      this.data.showCancelButton = true; // Establecer un valor predeterminado para el botón Cancelar
    }
  }

  onNoClick(): void {
    this.dialogRef.close(false); // Cierra el diálogo y devuelve 'false'
  }

  onYesClick(): void {
    this.dialogRef.close(true); // Cierra el diálogo y devuelve 'true'
  }

}
