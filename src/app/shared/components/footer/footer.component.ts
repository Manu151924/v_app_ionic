import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {

  activeIndex = 1;
  totalItems = 3;
  constructor(private router: Router) {
  this.router.events
    .pipe(filter(e => e instanceof NavigationEnd))
    .subscribe((e: any) => {
      this.syncWithRoute(e.urlAfterRedirects);
    });
}
syncWithRoute(url: string) {
  if (url.includes('/task')) this.activeIndex = 0;
  else if (url.includes('/home')) this.activeIndex = 1;
  else if (url.includes('/account')) this.activeIndex = 2;
}
go(tab: string, index: number) {
  this.activeIndex = index;

  if (tab === 'home') this.router.navigateByUrl('/home');
  if (tab === 'account') this.router.navigateByUrl('/account');
}



tabs = [
  {
    id: 'task',
    label: 'Task',
    activeIcon: 'assets/icon/active-task.png',
    inactiveIcon: 'assets/icon/task.png'
  },
  {
    id: 'home',
    label: 'Home',
    activeIcon: 'assets/icon/active-home.png',
    inactiveIcon: 'assets/icon/homes.png'
  },
  {
    id: 'account',
    label: 'Account',
    activeIcon: 'assets/icon/active-account.png',
    inactiveIcon: 'assets/icon/account.png'
  }
];


  get path() {
    return this.getNavbarPath(this.activeIndex, this.totalItems);
  }

  setActive(i: number) {
    this.activeIndex = i;
  }

  getNavbarPath(activeIndex: number, totalItems: number) {
    const width = 1000;
    const height = 100;
    const tabWidth = width / totalItems;
    const centerX = activeIndex * tabWidth + tabWidth / 2;

    const curveWidth = 90;
    const shoulderWidth = 45;
    const depth = 55;

    const leftShoulderStart = centerX - curveWidth - shoulderWidth;
    const leftCurveStart = centerX - curveWidth;
    const rightCurveEnd = centerX + curveWidth;
    const rightShoulderEnd = centerX + curveWidth + shoulderWidth;

    return `
      M 0,0
      L ${leftShoulderStart},0
      C ${leftCurveStart},0 ${leftCurveStart},${depth} ${centerX},${depth}
      C ${rightCurveEnd},${depth} ${rightCurveEnd},0 ${rightShoulderEnd},0
      L ${width},0
      L ${width},${height}
      L 0,${height}
      Z
    `;
  }
}
