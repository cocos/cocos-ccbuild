import { buildEngine } from '@ccbuild/build-engine';
import { genOptionsFromMatrix } from './matrix-options';

test('matrix options', async () => {
    const optionList = genOptionsFromMatrix<buildEngine.Options>({
        engine: ['./test-engine-source', './test-engine-source-without-symlink'],
        out: ['./lib-matrix-options'],
        platform: ['ALIPAY', 'OPEN_HARMONY', 'HTML5'],
        mode: ['BUILD', 'PREVIEW'],
        preserveType: [false, true],
    });
    expect(
    // after remove duplicates, should be 24.
        optionList.filter((opt, index) => optionList.findIndex(opt2 => opt2.name === opt.name) === index).length
    ).toBe(24);
    expect(optionList).toMatchSnapshot();
});
