import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from './user.model';
import { Router } from '@angular/router';

export interface AuthResponseData{
    kind:string;
    idToken:string;
    email:string;
    refreshToken:string;
    expiredIn:string;
    localId:string;
    registered?:boolean;
}
@Injectable({providedIn:'root'})
export class AuthService{
    user=new BehaviorSubject<User>(null);
    private tokenExpirationTimer:any;
    constructor(private http:HttpClient,private router:Router){}
    logout(){
        this.user.next(null);
        localStorage.removeItem('userData'),
        this.router.navigate(['/auth']);
        if(this.tokenExpirationTimer){
            clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer=null;
    }
    autoLogout(expirationDuration:number){
        this.tokenExpirationTimer=setTimeout(()=>{
            this.logout();
        },expirationDuration)
    }
    signUp(email:string,password:string){
       return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyALhk4FZ2ps-xMP1wMLnIhF5vLYLBha8lc',
        {
            email:email,
            password:password,
            returnSecureToken:true
        }
        ).pipe(catchError(this.handelError),tap(resData=>{
           this.handleAuth(
               resData.email,
               resData.localId,
               resData.idToken,
               +resData.expiredIn
            )
        }))
    }
    signIn(email:string,password:string){
        return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyALhk4FZ2ps-xMP1wMLnIhF5vLYLBha8lc',
        {
            email:email,
            password:password,
            returnSecureToken:true
        }
        ).pipe(catchError(this.handelError),tap(resData=>{
            this.handleAuth(
                resData.email,
                resData.localId,
                resData.idToken,
                +resData.expiredIn
             )
         }))
    }
    private handleAuth(email:string,userId:string,token:string,expiredIn:number){
        const expirationDate=new Date(new Date().getTime()+expiredIn*1000)
        const user=new User(
            email,
            userId,
            token,
            expirationDate
            );
        this.user.next(user);
        this.autoLogout(expiredIn*1000);
        localStorage.setItem('userData',JSON.stringify(user))
    }
    autoLogin(){
       const userData:{
           email:string,
           id:string,
           _token:string,
           _tokenExpirationDate:string
       }= JSON.parse(localStorage.getItem('userData'));
       if(!userData){
           return;
       }
       const loadedUser=new User(userData.email,userData.id,userData._token,new Date(userData._tokenExpirationDate));
       if(!loadedUser.token){
          this.user.next(loadedUser);
          const expiration=new Date(userData._tokenExpirationDate).getTime()-new Date().getTime()
            this.autoLogout(expiration);
       }
    }
    private handelError(errorRes:HttpErrorResponse){
        let error='An unknow error';
        if(!errorRes.error||!errorRes.error.error){
            return throwError(error);
        }
         switch(errorRes.error.error.message){
            case 'EMAIL_EXISTS':
                error='this email exist already';
                break;
            case 'EMAIL_NOT_FOUND':
                error='email or password not valid';
                break;
            case 'INVALID_PASSWORD':
                error='email or password not valid';
                break;
           }
         return throwError(error);
    }
}