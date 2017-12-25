import { Game } from './game';
import { Unit } from './unit';

export class TypeList {
  isCollapsed = true
  isEnding = false
  uiList = new Array<Unit>()

  constructor(
    public type = "",
    public list = new Array<Unit>()
  ) { }

  getId() {
    return this.type
  }

  allCustom(percent: number) {
    this.list.filter(u => !u.alwaysOn).forEach(u => u.percentage = percent)
  }
  reload() {
    this.uiList = this.list.filter(u => u.unlocked)
  }
}
