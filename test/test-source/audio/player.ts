import { EDITOR, TEST } from "virtual:const";
import { testDecorator } from "../decorators";
@testDecorator
export class Player {

    @testDecorator
    play () {
        if (EDITOR) {
            console.log('this is editor');
        } else if (TEST) {
            console.log('this is test');
        }
    }
}

export const player: Player = new Player();