import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { TransferService } from '../../services/transfer.service';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { CommonModule } from '@angular/common';
import { PrintService } from '../../services/print.services';
import { MatDialog } from '@angular/material/dialog';
import { TransferDoneComponent } from '../forms/transfer-done/transfer-done.component';
/**
 * Componente para mostrar las transferencias hecha por el usuario de la cuenta
 */

@Component({
  selector: 'app-actividad',
  standalone: true,
  imports: [
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatPaginatorModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './actividad.component.html',
  styleUrl: './actividad.component.scss'
})
export class ActividadComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;

  private readonly transferService = inject(TransferService);
  private readonly dialog = inject(MatDialog);

  authService = inject(AuthService);
  tokenService = inject(TokenService);
  private readonly srvImpresion = inject(PrintService);


  sender = -1;
  transfers: any[] = [];
  displayedColumns: string[] = [
    'details',
    'amount',
    'Date'
  ];
  dataSource = new MatTableDataSource<any>();
  totalItems: number = 0;
  pageSize: number = 5;
  currentPage: number = 0; // Agregamos la página actual




/**
 * 
 * @param row Para identificar y obtener la fila del registro de transferencia seleccionado
 */
  getTransfer(row: any) {
    this.dialog.open(TransferDoneComponent, {
      data: {
        referencia: row.referenceCode,
        detalles: row.details,
        fecha: row.transactionDateTime ,
        beneficiario:  row.receiverPhone,
        monto: row.amount
      },
    });
  }


/**
 * Para imprimir los registros de transferencias en PDF
 */
  onPrintPDF() {
    const encabezado = [
      'Details',
      'Amount',
      'Date'
    ];

    const dataSourceData = this.dataSource.data;
    const cuerpo = dataSourceData.map((row: any) => {
      const datos = [
        row.details,
        row.amount,
        row.transactionDateTime
      ];
      return datos;
    });
    this.srvImpresion.print(encabezado, cuerpo, 'Transfer activity - ' + this.tokenService.decodeToken().phoneNumber, true);
  }


/**
 * Inicia los datos de la tabla de registros de transferencias
 */
  ngAfterViewInit() {
    this.loadData(); // Carga inicial de datos

    this.paginator.page.subscribe((event: PageEvent) => {
      if (this.currentPage !== event.pageIndex || this.pageSize !== event.pageSize) {
        this.pageSize = event.pageSize;
        this.currentPage = event.pageIndex;
        const offset = this.currentPage * this.pageSize;

        this.loadData(this.pageSize, offset);
      }
    });
  }


  /**
   * Carga los datos a la tabla o Grid
   * @param limit 
   * @param offset 
   */
  loadData(limit: number = this.pageSize, offset: number = 0): void {
    this.sender = ((this.tokenService.decodeToken().phoneNumber));

    this.transferService.getTransfers(limit, offset, this.authService.getUserActual().userId).subscribe({
      next: (data) => {
        this.dataSource.data = data.transfers;
        this.totalItems = data.total;
        this.paginator.length = this.totalItems;
        this.paginator.pageSize = this.pageSize;
        this.paginator.pageIndex = this.currentPage;
      },
      error: (error) => {
      }
    });
  }
}