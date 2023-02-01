import { EDITOR, TEST } from "virtual";

export class Player {
    play () {
        if (EDITOR) {
            console.log('this is editor');
        } else if (TEST) {
            console.log('this is test');
        }
    }
}

export const player: Player = new Player();