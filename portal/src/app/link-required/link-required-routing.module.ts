import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LinkRequiredComponent } from './link-required.component';

const routes: Routes = [
  {
    path: 'link-required',
    component: LinkRequiredComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LinkRequiredRoutingModule { }
