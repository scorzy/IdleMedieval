import { Action } from './action'

export class PrestigeGroupModel {
    constructor(
        public id: string,
        public name: string,
        public description: string,
        public actions: Array<Action>) { }
}
