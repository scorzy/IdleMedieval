import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrestigeGroupComponent } from './prestige-group.component';

describe('PrestigeGroupComponent', () => {
  let component: PrestigeGroupComponent;
  let fixture: ComponentFixture<PrestigeGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrestigeGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrestigeGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
