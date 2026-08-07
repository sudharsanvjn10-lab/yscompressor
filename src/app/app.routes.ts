import { Routes } from '@angular/router';
import { FeedbackComponent } from './features/feedback/feedback.component';
import { AboutComponent } from './features/about/about.component';

export const routes: Routes = [
  { path: 'feedback', component: FeedbackComponent },
  { path: 'about', component: AboutComponent },
  { path: 'changelog', redirectTo: 'feedback', pathMatch: 'full' }
];
