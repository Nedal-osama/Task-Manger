import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ETasks } from './e-tasks';

describe('ETasks', () => {
  let component: ETasks;
  let fixture: ComponentFixture<ETasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ETasks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ETasks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
