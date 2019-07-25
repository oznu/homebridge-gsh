import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LinkAccountRoutingModule } from './link-account-routing.module';
import { LinkAccountComponent } from './link-account.component';


@NgModule({
  declarations: [LinkAccountComponent],
  imports: [
    CommonModule,
    LinkAccountRoutingModule
  ]
})
export class LinkAccountModule { }
