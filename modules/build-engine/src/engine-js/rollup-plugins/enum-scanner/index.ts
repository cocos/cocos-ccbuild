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

    return [];
}
