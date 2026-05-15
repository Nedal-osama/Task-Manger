import { TestBed } from '@angular/core/testing';

import { Snippet } from './snippet';

describe('Snippet', () => {
  let service: Snippet;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Snippet);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
