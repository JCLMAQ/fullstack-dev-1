import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '@db/prisma';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private httpClient = inject(HttpClient)

  register(body: any): Promise<any> {
    return new Promise((resolve, reject) => {
    this.userRegister(body)
      .toPromise()
      .then(res => {
        resolve(res);
      }).catch((error) => {
        reject(error.message);
      });

    });
  }

  userRegister(user: User): Observable<User>{
    return this.httpClient.post<User>('api/auths/auth/registerwithpwd', user)
  }
}
