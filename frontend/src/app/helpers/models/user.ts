export class User {
    userId: number = 0;
    name: string = '';
    middleName: string = '';
    lastName: string = '';
    firstSurname: string = '';
    email: string = '';
    rol: number = -1;
  
    constructor(user?: User) {
      this.userId = user?.userId ?? 0;
      this.name = user?.name ?? '';
      this.middleName = user?.middleName ?? '';
      this.lastName = user?.lastName ?? '';
      this.firstSurname = user?.firstSurname ?? '';
      this.email = user?.email ?? '';
      this.rol = user?.rol ?? -1;
    }
  }
  