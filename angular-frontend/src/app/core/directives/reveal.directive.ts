import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  @Input() delay = 0;

  private observer: IntersectionObserver | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const target = this.el.nativeElement;
    target.classList.add('opacity-0');
    target.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    target.style.transform = 'translateY(0.5rem)';

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            target.style.transitionDelay = `${this.delay}ms`;
            target.classList.remove('opacity-0');
            target.style.transform = 'translateY(0)';
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(target);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
