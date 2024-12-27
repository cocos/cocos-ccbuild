import { type Options, resolveOptions } from './core/options';
import { EnumData, scanEnums } from './core/enum';
import { rollup as Bundler } from '@ccbuild/bundler';
import rollup = Bundler.core;

let enumData: EnumData | undefined;

export function getEnumData(): EnumData | undefined {
    return enumData;
}

/**
 * The main unplugin instance.
 */
export async function rpEnumScanner(rawOptions: Options): Promise<rollup.Plugin[]> {
    const options = resolveOptions(rawOptions);

    enumData = await scanEnums(options);
    const { defines } = enumData;

    defines['Float32Array.BYTES_PER_ELEMENT'] =  4;
    defines['Float64Array.BYTES_PER_ELEMENT'] =  8;
    defines['Uint8Array.BYTES_PER_ELEMENT'] =  1;
    defines['Uint8ClampedArray.BYTES_PER_ELEMENT'] = 1;
    defines['Uint16Array.BYTES_PER_ELEMENT'] =  2;
    defines['Uint32Array.BYTES_PER_ELEMENT'] =  4;
    defines['Int8Array.BYTES_PER_ELEMENT'] =  1;
    defines['Int16Array.BYTES_PER_ELEMENT'] =  2;
    defines['Int32Array.BYTES_PER_ELEMENT'] =  4;

    return [];
}
