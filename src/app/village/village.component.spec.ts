import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VillageComponent } from './village.component';

describe('VillageComponent', () => {
  let component: VillageComponent;
  let fixture: ComponentFixture<VillageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VillageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VillageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
