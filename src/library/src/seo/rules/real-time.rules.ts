import assert from 'assert';
import { Helper } from '../../common/helpers';
import { IRule } from '../../common/models/rule.interfaces';
import { IUserTarget } from '../../common/models/target.interface';
import { ITester } from '../../common/models/tester.interfaces';

export const RTRules: IRule[] = [
    {
        name: 'TITLE',
        description: `Validate the title tag.`,
        success: false,
        errors: [],
        warnings: [],
        info: [],
        testData: {},
        validator: async (payload: any, tester: ITester) => {
            const value = payload.value;

            tester.compareTest(
                Helper.getComparaisonTestParameters(
                    100,
                    assert.notStrictEqual,
                    value.length,
                    0,
                    'Title tags should not be empty',
                    IUserTarget.both,
                    "TITLE",
                    true
                ));

            if (value) {
                tester.BooleanLint(Helper.getBooleanTestParameters(
                    30,
                    assert.ok,
                    value.length > 10,
                    'This title tag is shorter than the recommended minimum limit of 10.',
                    IUserTarget.contentManager,
                    "TITLE",
                    false,
                    value
                ));

                tester.BooleanLint(
                    Helper.getBooleanTestParameters(
                        30,
                        assert.ok,
                        value.length < 70,
                        'This title tag is longer than the recommended limit of 70.',
                        IUserTarget.contentManager,
                        "TITLE",
                        false,
                        value
                    ));

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    60,
                    assert.ok,
                    value.length < 200,
                    `Something could be wrong this title tag is over 200 chars. Currently: ${value.length}`,
                    IUserTarget.contentManager,
                    "TITLE",
                    false,
                    value
                ));

                /*const compareArr = Helper.cleanString(value)
                    .split(' ')
                    .filter((i) => [':', '|', '-'].indexOf(i) === -1);

                //TODO localize this part.
                const stopWords = ['a', 'and', 'but', 'so', 'on', 'or', 'the', 'was', 'with'];
                const matches = compareArr.filter((t) => stopWords.indexOf(t) !== -1);

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    20,
                    assert.ok,
                    matches.length == 0,
                    `Title tag includes stopword`,
                    IUserTarget.contentManager,
                    "TITLE",
                    value
                ));*/
            }
        },
    },
    {
        name: 'META (description)',
        description: `Validate the meta description tag.`,
        success: false,
        errors: [],
        warnings: [],
        info: [],
        testData: {},
        validator: async (payload, tester) => {
            const value = payload.value;
            const titleValue = payload.titleValue;

            tester.compareTest(Helper.getComparaisonTestParameters(
                90,
                assert.notStrictEqual,
                value.length,
                0,
                'Meta description should not be empty',
                IUserTarget.contentManager,
                "META",
                true
            ));

            if (value) {
                tester.BooleanLint(Helper.getBooleanTestParameters(
                    20,
                    assert.ok,
                    value.length > 10,
                    `This meta description is shorter than the recommended minimum limit of 10.`,
                    IUserTarget.contentManager,
                    "META",
                    false,
                    value
                ));

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    30,
                    assert.ok,
                    value.length < 120,
                    `This meta description is longer than the recommended limit of 120.`,
                    IUserTarget.contentManager,
                    "META",
                    false,
                    value,
                ));

                tester.BooleanTest(Helper.getBooleanTestParameters(
                    40,
                    assert.ok,
                    value.length < 300,
                    `Investigate this meta description. Something could be wrong as it is over 300 chars. Currently: ${value}`,
                    IUserTarget.contentManager,
                    "META",
                    false,
                    value
                ));
            }

            /*if (titleValue) {
                const titleArr = Helper.cleanString(titleValue)
                    .split(' ')
                    .filter((i) => [':', '|', '-', ','].indexOf(i) === -1);
                if (titleArr) {
                    const compareArr = Helper.cleanString(value)
                        .split(' ')
                        .filter((i) => [':', '|', '-', ','].indexOf(i) === -1);

                    const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);

                    tester.BooleanLint(Helper.getBooleanTestParameters(
                        70,
                        assert.ok,
                        matches.length >= 1,
                        'Meta description should include at least 1 of the words in the title tag.',
                        IUserTarget.contentManager,
                        "META",
                        value
                    ));
                }
            }*/
        },
    },
    {
        name: 'H1',
        description: `Validate the H1 tag.`,
        success: false,
        errors: [],
        warnings: [],
        info: [],
        testData: {},
        validator: async (payload, tester) => {
            const value = payload.value;
            const titleValue = payload.titleValue;

            tester.compareTest(Helper.getComparaisonTestParameters(
                90,
                assert.notStrictEqual,
                value.length,
                0,
                'H1 tags should not be empty',
                IUserTarget.contentManager,
                "H1",
                false
            ));

            if (value) {
                tester.BooleanLint(Helper.getBooleanTestParameters(
                    30,
                    assert.ok,
                    value.length < 70,
                    `H1 tag is longer than the recommended limit of 70.`,
                    IUserTarget.contentManager,
                    "H1",
                    false,
                    value
                ));

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    30,
                    assert.ok,
                    value.length > 10,
                    `H1 tag is shorter than the recommended limit of 10.`,
                    IUserTarget.contentManager,
                    "H1",
                    false,
                    value
                ));
            }

            /*const titleArr = Helper.cleanString(titleValue)
                .split(' ')
                .filter((i) => [':', '|', '-'].indexOf(i) === -1);

            if (titleArr) {
                const compareArr = Helper.cleanString(value)
                    .split(' ')
                    .filter((i) => [':', '|', '-'].indexOf(i) === -1);

                const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);
                if (matches.length < 1) console.log(titleArr, compareArr);

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    70,
                    assert.ok,
                    matches.length >= 1,
                    `H1 tag should have at least 1 word from your title tag.`,
                    IUserTarget.contentManager,
                    "H1",
                    value
                ));
            }*/
        },
    },
    {
        name: 'H2',
        description: `Validate the H2 tag.`,
        success: false,
        errors: [],
        warnings: [],
        info: [],
        testData: {},
        validator: async (payload, tester) => {
            const value = payload.value;
            const titleValue = payload.titleValue;

            tester.compareTest(Helper.getComparaisonTestParameters(
                90,
                assert.notStrictEqual,
                value.length,
                0,
                'H2 tags should not be empty',
                IUserTarget.contentManager,
                "H2",
                false
            ));

            if (value) {
                tester.BooleanLint(Helper.getBooleanTestParameters(
                    20,
                    assert.ok,
                    value.length < 100,
                    `H2 tag is longer than the recommended limit of 100.`,
                    IUserTarget.contentManager,
                    "H2",
                    false,
                    value
                ));

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    30,
                    assert.ok,
                    value.length > 7,
                    `H2 tag is shorter than the recommended limit of 7.`,
                    IUserTarget.contentManager,
                    "H2",
                    false,
                    value
                ));
            }

            /*const titleArr = Helper.cleanString(titleValue)
                .split(' ')
                .filter((i) => [':', '|', '-'].indexOf(i) === -1);

            if (titleArr) {
                const compareArr = Helper.cleanString(value)
                    .split(' ')
                    .filter((i) => [':', '|', '-'].indexOf(i) === -1);

                const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);
                if (matches.length < 1) console.log(titleArr, compareArr);

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    70,
                    assert.ok,
                    matches.length >= 1,
                    `H2 tag should have at least 1 word from your title tag.`,
                    IUserTarget.contentManager,
                    "H2",
                    value
                ));
            }*/
        },
    },
    {
        name: 'H3',
        description: `Validate the H3 tag.`,
        success: false,
        errors: [],
        warnings: [],
        info: [],
        testData: {},
        validator: async (payload, tester) => {
            const value = payload.value;
            tester.compareTest(Helper.getComparaisonTestParameters(
                70,
                assert.notStrictEqual,
                value.length,
                0,
                'h3 tags should not be empty',
                IUserTarget.both,
                "H3",
                false
            ));
            if (value) {
                tester.BooleanLint(Helper.getBooleanTestParameters(
                    20,
                    assert.ok,
                    value.length < 100,
                    `h3 tag is longer than the recommended limit of 100.`,
                    IUserTarget.contentManager,
                    "H3",
                    false,
                    value
                ));

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    20,
                    assert.ok,
                    value.length > 7,
                    `h3 tag is shorter than the recommended limit of 7.`,
                    IUserTarget.contentManager,
                    "H3",
                    false,
                    value
                ));
            }
        },
    },
    {
        name: 'H4',
        description: `Validate the H4 tag.`,
        success: false,
        errors: [],
        warnings: [],
        info: [],
        testData: {},
        validator: async (payload, tester) => {
            const value = payload.value;

            tester.compareTest(Helper.getComparaisonTestParameters(
                50,
                assert.notEqual,
                value.length,
                0,
                'h4 tags should not be empty',
                IUserTarget.both,
                "H4",
                false
            ));

            if (value) {
                tester.BooleanLint(Helper.getBooleanTestParameters(
                    10,
                    assert.ok,
                    value.length < 100,
                    `h4 tag is longer than the recommended limit of 100.`,
                    IUserTarget.contentManager,
                    "H4",
                    false,
                    value
                ));

                tester.BooleanLint(Helper.getBooleanTestParameters(
                    10,
                    assert.ok,
                    value.length > 7,
                    `h4 tag is shorter than the recommended limit of 7.`,
                    IUserTarget.contentManager,
                    "H4",
                    false,
                    value
                ));
            }
        },
    },
    {
        name: 'IMG',
        description: 'Validate the IMG tag.',
        success: false,
        errors: [],
        warnings: [],
        info: [],
        testData: {},
        validator: async (payload, tester) => {
            const value = payload.value;

            tester.BooleanLint(Helper.getBooleanTestParameters(
                100,
                assert.ok,
                value.alt && value.alt.length > 0,
                `Images should have alt tags.`,
                IUserTarget.both,
                "IMG",
                false,
                value,
            ));
        },
      },
]