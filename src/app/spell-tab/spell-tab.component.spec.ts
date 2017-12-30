import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpellTabComponent } from './spell-tab.component';

describe('SpellTabComponent', () => {
  let component: SpellTabComponent;
  let fixture: ComponentFixture<SpellTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpellTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpellTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
