import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LinkRequiredRoutingModule } from './link-required-routing.module';
import { LinkRequiredComponent } from './link-required.component';


@NgModule({
  declarations: [LinkRequiredComponent],
  imports: [
    CommonModule,
    LinkRequiredRoutingModule
  ]
})
export class LinkRequiredModule { }
