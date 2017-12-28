import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurVillComponent } from './cur-vill.component';

describe('CurVillComponent', () => {
  let component: CurVillComponent;
  let fixture: ComponentFixture<CurVillComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurVillComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurVillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
