import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LinkAccountComponent } from './link-account.component';

const routes: Routes = [
  {
    path: 'link-account',
    component: LinkAccountComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LinkAccountRoutingModule { }
