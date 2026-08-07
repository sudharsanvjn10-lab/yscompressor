import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';

describe('ThemeService', () => {
  let service: ThemeService;
  const STORAGE_KEY = 'yazhsivconversion-theme';
  let originalMatchMedia: any;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('1. should resolve to stored theme when localStorage key is present', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('2. should resolve to dark theme when localStorage is absent but OS prefers dark', () => {
    localStorage.removeItem(STORAGE_KEY);
    window.matchMedia = (query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as any;

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('3. should resolve to light theme when localStorage is absent and OS prefers light', () => {
    localStorage.removeItem(STORAGE_KEY);
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as any;

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('4. should toggle theme, persist to localStorage, and update data-theme attribute', () => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ThemeService);
    const initial = service.theme();

    service.toggle();

    const expected = initial === 'dark' ? 'light' : 'dark';
    expect(service.theme()).toBe(expected);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(expected);
    expect(document.documentElement.getAttribute('data-theme')).toBe(expected);
  });
});
