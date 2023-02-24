import 'internal:native';
import { EDITOR, TEST } from "internal:constants";
import './module';
import 'pal/audio';
import 'pal/minigame';
import { testDecorator } from "../decorators";
import { testDecorator as testDecorator2 } from 'cc.decorator';
import { zlib } from '../external/zlib';
import { zlib as zlib2 } from '../external/zlib.js';
import './struct'
import './template-string-type'
import './dynamic-import'

console.log(zlib.Inflate)
console.log(zlib2.Inflate)


@testDecorator
export class Player {

    @testDecorator
    play (): Promise<void> {
        if (EDITOR) {
            console.log('this is editor');
        } else if (TEST) {
            console.log('this is test');
        }
        return new Promise(resolve => resolve());
    }
}

export const player: Player = new Player();

player.play().then(() => {
    console.log('test log');
});

export const testConsoleLog = {
    test: (): void => {console.warn('test console log')},
    test2: (): void => console.warn('test console log'),
    test3: (): number => 1,
};