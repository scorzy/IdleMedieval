import { Injectable } from '@angular/core';
import { Game } from './model/game';

@Injectable()
export class ServService {

  game: Game
  constructor() {
    this.game = new Game()

    setInterval(this.update.bind(this), 250)
  }

  update() {
    this.game.update()
  }

}
