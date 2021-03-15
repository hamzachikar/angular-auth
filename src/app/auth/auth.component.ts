import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService, AuthResponseData } from './auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html'
})
export class AuthComponent {
  isLoginMode=true;
  isLoading=false;
  error:string=null;
  constructor(private authService:AuthService,private route:Router){}
  onSwitchMode(){
    this.isLoginMode=!this.isLoginMode;
  }
  onSubmit(form:NgForm){
    const email=form.value.email;
      const password=form.value.password;
    let authObs:Observable<AuthResponseData>;
    if(this.isLoginMode){
      this.isLoading=true;
      authObs=this.authService.signIn(email,password)
    }
    else{
      if(!form.valid){
        form.reset();
        return;
      }
      this.isLoading=true;
      authObs=this.authService.signUp(email,password)
    }
    authObs.subscribe(resData=>{
      console.log(resData);
      this.isLoading=false;
      this.route.navigate(['/recipes']);
      form.reset();
    },error=>{
      this.isLoading=false
      this.error=error;
    })
    
  }
}
