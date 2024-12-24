export enum MyEnum {
    AAA,
    BBB,
    CCC = 123,
    DDD = 'hello',
    EEE = BBB,
}

console.log(MyEnum.AAA);
console.log(MyEnum.BBB);
console.log(MyEnum.CCC);
console.log(MyEnum.DDD);
console.log(MyEnum.EEE);

export const enum MyConstEnum {
    C_AAA,
    C_BBB,
    C_DDD = MyEnum.DDD,
    C_EEE = 1234,
    C_FFF,
}

console.log(MyConstEnum.C_AAA, MyConstEnum.C_BBB);
console.log(MyConstEnum.C_DDD, MyConstEnum.C_EEE);
console.log(MyConstEnum.C_FFF, MyConstEnum.C_AAA);

export function testConstantOfTypeArray(): void {
    console.log('Float32Array.BYTES_PER_ELEMENT:' + Float32Array.BYTES_PER_ELEMENT);
    console.log('Float64Array.BYTES_PER_ELEMENT:' + Float64Array.BYTES_PER_ELEMENT);
    console.log('Uint8Array.BYTES_PER_ELEMENT:' + Uint8Array.BYTES_PER_ELEMENT);
    console.log('Uint8ClampedArray.BYTES_PER_ELEMENT:' + Uint8ClampedArray.BYTES_PER_ELEMENT);
    console.log('Uint16Array.BYTES_PER_ELEMENT:' + Uint16Array.BYTES_PER_ELEMENT);
    console.log('Uint32Array.BYTES_PER_ELEMENT:' + Uint32Array.BYTES_PER_ELEMENT);
    console.log('Int8Array.BYTES_PER_ELEMENT:' + Int8Array.BYTES_PER_ELEMENT);
    console.log('Int16Array.BYTES_PER_ELEMENT:' + Int16Array.BYTES_PER_ELEMENT);
    console.log('Int32Array.BYTES_PER_ELEMENT:' + Int32Array.BYTES_PER_ELEMENT);

    console.log(`Int32Array.BYTES_PER_ELEMENT: ${Int32Array.BYTES_PER_ELEMENT}`);
}

export enum Button {
    BUTTON_SOUTH,
    BUTTON_EAST,
    BUTTON_WEST,
    BUTTON_NORTH,
    NS_MINUS,
    NS_PLUS,
    BUTTON_L1,
    BUTTON_L2,
    BUTTON_L3,
    BUTTON_R1,
    BUTTON_R2,
    BUTTON_R3,
    DPAD_UP,
    DPAD_DOWN,
    DPAD_LEFT,
    DPAD_RIGHT,
    LEFT_STICK_UP,
    LEFT_STICK_DOWN,
    LEFT_STICK_LEFT,
    LEFT_STICK_RIGHT,
    RIGHT_STICK_UP,
    RIGHT_STICK_DOWN,
    RIGHT_STICK_LEFT,
    RIGHT_STICK_RIGHT,
    ROKID_MENU,
    ROKID_START,
}

type NativeButtonState = Record<Button, number>

const _nativeButtonMap = {
    1: Button.BUTTON_EAST,
    2: Button.BUTTON_SOUTH,
    3: Button.BUTTON_NORTH,
    4: Button.BUTTON_WEST,
    5: Button.BUTTON_L1,
    6: Button.BUTTON_R1,
    7: Button.NS_MINUS,
    8: Button.NS_PLUS,
    9: Button.BUTTON_L3,
    10: Button.BUTTON_R3,
    11: Button.ROKID_MENU,
    12: Button.ROKID_START,
};

export class GamepadInputDevice {
    private _nativeButtonState: NativeButtonState = {
        [Button.BUTTON_SOUTH]: 0,
        [Button.BUTTON_EAST]: 0,
        [Button.BUTTON_WEST]: 0,
        [Button.BUTTON_NORTH]: 0,
        [Button.NS_MINUS]: 0,
        [Button.NS_PLUS]: 0,
        [Button.BUTTON_L1]: 0,
        [Button.BUTTON_L2]: 0,
        [Button.BUTTON_L3]: 0,
        [Button.BUTTON_R1]: 0,
        [Button.BUTTON_R2]: 0,
        [Button.BUTTON_R3]: 0,
        [Button.DPAD_UP]: 0,
        [Button.DPAD_DOWN]: 0,
        [Button.DPAD_LEFT]: 0,
        [Button.DPAD_RIGHT]: 0,
        [Button.LEFT_STICK_UP]: 0,
        [Button.LEFT_STICK_DOWN]: 0,
        [Button.LEFT_STICK_LEFT]: 0,
        [Button.LEFT_STICK_RIGHT]: 0,
        [Button.RIGHT_STICK_UP]: 0,
        [Button.RIGHT_STICK_DOWN]: 0,
        [Button.RIGHT_STICK_LEFT]: 0,
        [Button.RIGHT_STICK_RIGHT]: 0,
        [Button.ROKID_MENU]: 0,
        [Button.ROKID_START]: 0,
    };

    hello(): void {
        console.log(this._nativeButtonState);
        const button = _nativeButtonMap[0];
        this._nativeButtonState[button] = 1;
        this._nativeButtonState[Button.BUTTON_L2] = 1;
    }
}
