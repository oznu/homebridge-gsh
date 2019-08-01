import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TermsOfServiceRoutingModule } from './terms-of-service-routing.module';
import { TermsOfServiceComponent } from './terms-of-service.component';


@NgModule({
  declarations: [TermsOfServiceComponent],
  imports: [
    CommonModule,
    TermsOfServiceRoutingModule
  ]
})
export class TermsOfServiceModule { }
