import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TransferService } from '../../../services/transfer.service';
import { TokenService } from '../../../services/token.service';
import { TransferDoneComponent } from '../transfer-done/transfer-done.component';
@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule,
    MatButtonModule, MatInputModule, MatIconModule, MatCardModule, CommonModule],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.scss'
})

/**
 * Componente para iniciar una transferencia
 */

export class TransferComponent {
  private builder = inject(FormBuilder);
  frmTransfer: FormGroup;
  private transferService = inject(TransferService);
  private tokenService = inject(TokenService);
  private readonly dialog = inject(MatDialog);
  readonly dialogoRef = inject(MatDialogRef<TransferComponent>);

  @Output() animationFinished = new EventEmitter<any>(); //Inciar un emit como observable en otros componentes


  verificando = false;
  beneficiarioNoRegistrado = false;
  beneficiary: string = '';
  receiverPhoneNumber: string = '';
  senderPhoneNumber: string= this.tokenService.decodeToken().phoneNumber;
  receiverId = -1;

  constructor() {

    this.frmTransfer = this.builder.group({
      receiver: ['', [
        Validators.required,
        Validators.pattern('^[0-9]+$'),
        Validators.maxLength(12)
      ]],
      amount: ['', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/)
      ]],
      details: ['', [
        Validators.maxLength(100)
      ]]
    });

  }


  onVerifiedNumber() {
    this.transferService.verifyUser(this.frmTransfer.value.receiver).subscribe({
      next: (res) => {
        this.verificando = true;
        this.beneficiarioNoRegistrado = true;
        console.log('✅ Usuario encontrado:', res);
        this.beneficiary = `${res.user.name} ${res.user.middleName} ${res.user.firstSurname} ${res.user.lastName}`;
        this.receiverPhoneNumber = res.user.phoneNumber;
        this.receiverId = res.user.idUser;
      },
      error: (err) => {
        console.error('❌ Error al verificar usuario:', err);
        this.verificando = true;
        this.beneficiarioNoRegistrado = false;
      }
    });
  }

  onChangeNumber() {
    this.verificando = false;
  }


  get F() {
    return this.frmTransfer.controls;
  }



  private showTransferDone(
    referencia: string,
    detalles: string,
    fecha: string,
    beneficiario: string,
    monto: string) {
    this.dialog.open(TransferDoneComponent, {
      data: {
        referencia: referencia,
        detalles: detalles,
        fecha: fecha,
        beneficiario: beneficiario,
        monto: monto
      },
    });


    this.dialogoRef.close(); // Cierra el diálogo en caso de éxito

  }


  // Cambia la forma de emitir el evento cuando la transferencia es exitosa

  /**
   * Para ejecutar la transferencia
   */
  transfer() {
    this.transferService.transfer({
      sender: this.tokenService.decodeToken().phoneNumber,
      receiver: this.frmTransfer.value.receiver,
      amount: this.frmTransfer.value.amount,
      details: this.frmTransfer.value.details
    }).subscribe({
      next: (res) => {
        // Emitir el monto transferido
        this.animationFinished.emit({
          amount: this.frmTransfer.value.amount,
          receiver: String(this.receiverId),
          references: res.data.references

        });

        this.showTransferDone(
          res.data.references,
          this.frmTransfer.value.details,
          res.data.date + " " + res.data.time,
          this.frmTransfer.value.receiver,
          this.frmTransfer.value.amount
        );
      },
      error: (err) => {
      }
    });
  }
} //FIN
