import 'internal:native';
import { EDITOR, TEST } from "internal:constants";
import './module';
import 'pal/audio';
import 'pal/minigame';
import { testDecorator } from "../decorators";
import { testDecorator as testDecorator2 } from 'cc.decorator';
import { zlib } from '../external/zlib';
import { zlib as zlib2 } from '../external/zlib.js';

console.log(zlib.Inflate)
console.log(zlib2.Inflate)


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