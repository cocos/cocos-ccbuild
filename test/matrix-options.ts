export type MatrixOptions<T> = {
    [key in keyof T]: Array<T[key]>;
};

export interface OptionData<T> {
    /**
     * The auto generated name from one option config.
     */
    name: string;
    /**
     * The auto generated options.
     */
    options: T;
}

/**
 * This is a test utils inspired by github action matrix.
 * We can use this matrix tool to generate multiple build options for test.
 * The matrix option can help us list all combinations to avoid missing test cases.
 * 
 * @example
 * const multipleBuildOptions = genOptionsFromMatrix<buildEngine.Options>({
 *  engine: ['./test-engine-source', './test-engine-source-without-symlink'],
 *  platform: ['ALIPAY', 'OPEN_HARMONY', 'HTML5'],
 * });
 */
export function genOptionsFromMatrix<T>(matrixOptions: MatrixOptions<T>): OptionData<T>[] {    
    let count = 1;
    for (const key in matrixOptions) {
        const configList = matrixOptions[key];
        count *= configList.length;
    }
    const optDataList: OptionData<T>[] = [];
    for (let i = 0; i < count; ++i) {
        const optData: OptionData<T> = {
            name: '',
            options: {} as T,
        };
        collectOptionData(matrixOptions, optData, i);
        optDataList.push(optData);
    }
    return optDataList;
}

function collectOptionData<T>(matrixOptions: MatrixOptions<T>, optionData: OptionData<T>, currentIndex: number, keyIndex = 0): void {
    const keys = Object.keys(matrixOptions) as (keyof MatrixOptions<T>)[];
    const key = keys[keyIndex];
    if (!key) {
        return;
    }
    const configList = matrixOptions[key];
    const iteratorCount = getIteratorCount(matrixOptions, keyIndex);
    const targetIndex = Math.floor(currentIndex / iteratorCount) % configList.length;
    optionData.name += `${key.toString()}:${configList[targetIndex]};`;
    optionData.options[key] = configList[targetIndex];
    collectOptionData(matrixOptions, optionData, currentIndex, ++keyIndex);
}

function getIteratorCount<T> (matrixOptions: MatrixOptions<T>, keyIndex: number): number {
    const keys = Object.keys(matrixOptions);
    if (keyIndex === keys.length - 1) {
        return 1;
    } else {
        const nextKeyLevel = keyIndex + 1;
        const nextKey = keys[nextKeyLevel] as keyof MatrixOptions<T>;
        const nextConfigList = matrixOptions[nextKey];
        return nextConfigList.length * getIteratorCount(matrixOptions, keyIndex + 1);
    }
}