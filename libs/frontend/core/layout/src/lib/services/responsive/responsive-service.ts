import { BreakpointObserver } from '@angular/cdk/layout';
import {
  computed,
  inject,
  Injectable,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDrawerMode } from '@angular/material/sidenav';

@Injectable({
  providedIn: 'root',
})
export class ResponsiveService {
  private readonly extraSmall = '(max-width: 299px)';
  private readonly small = '(min-width: 300px) and(max-width: 599px)';
  private readonly medium = '(min-width: 600px) and (max-width: 999px)';
  private readonly large = '(min-width: 1000px)';
  private readonly mobileLimit = '(max-width: 800px)';

  breackpointObserver = inject(BreakpointObserver);

  screenWidth = toSignal(
    this.breackpointObserver.observe([
      this.extraSmall,
      this.small,
      this.medium,
      this.large,
      this.mobileLimit,
    ]),
  );

  // extraSmallWidth = computed(() => this.screenWidth()?.breakpoints[this.extraSmall]);
  smallWidth = computed(() => this.screenWidth()?.breakpoints[this.small]);
  mediumWidth = computed(() => this.screenWidth()?.breakpoints[this.medium]);
  largeWidth = computed(() => this.screenWidth()?.breakpoints[this.large]);
  mobileLimitWidth = computed(
    () => this.screenWidth()?.breakpoints[this.mobileLimit],
  );

  isMobile = linkedSignal({
    source: this.mobileLimitWidth,
    computation: () => (this.mobileLimitWidth() ? true : false),
  });

  isCollapsed = signal(false); // Menu Bar open with large or small:

  // isMenuBarOpen = linkedSignal({
  //   source: this.isMobile,
  //   computation: () => (this.isMobile() ? false : true)
  // }); // Menu Bar open :

  isMenuBarOpen = signal(true);

  modeSideNav = computed(() => (this.isMobile() ? 'over' : 'side'));
  sideNavMode = this.modeSideNav() as MatDrawerMode;

  sideNavOpen = computed(() => this.isMenuBarOpen());

  sideNavWidth = computed(() =>
    this.isMenuBarOpen() ? (this.isCollapsed() ? '65px' : '250px') : '0px',
  );
  // sideNavWidth = computed(() => (
  //   this.modeSideNav() === 'over' ? '0px' : (this.isMenuBarOpen() ? (this.isCollapsed() ? '65px' : '250px') : '0px')
  // ));
  styleMarginLeft = computed(() =>
    this.modeSideNav() === 'over'
      ? '0px'
      : this.isMenuBarOpen()
        ? this.isCollapsed()
          ? '65px'
          : '250px'
        : '0px',
  );
}
