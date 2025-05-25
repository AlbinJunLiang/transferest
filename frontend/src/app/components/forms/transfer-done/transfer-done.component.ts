import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardActions, MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-transfer-done',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatButtonModule,
    MatFormFieldModule, MatIconModule, MatDialogContent, MatCardActions, MatDialogModule],
  templateUrl: './transfer-done.component.html',
  styleUrl: './transfer-done.component.scss'
})
export class TransferDoneComponent {
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;


  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    referencia: string,
    detalles: string,
    fecha: string,
    beneficiario: string,
    monto: string
  }) {
  }
/**
 * Mostrar el reporte o comprobante de la transferencia realizada en formato pdf
 */

  printPDF() {
    const hoy = new Date();
    const fileTitle = (hoy.getDate() + hoy.getMonth() + hoy.getFullYear() + hoy.getTime() + ".pdf");
    const element = document.getElementById('voucher');
    const opt = {
      margin: [0, 5, 5, 0], // margen superior, izquierdo, inferior, derecho
      filename: fileTitle,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 4
      },
      jsPDF: {
        unit: 'mm',
        format: [89, 160.7], // tamaño basado en px convertido a mm
        orientation: 'portrait'
      }
    };
    html2pdf().from(element).set(opt).save();
  }


}
