import assert from 'assert';
import { Helper } from '../../common/helpers';
import { IRule } from '../../common/models/rule.interfaces';
import { IUserTarget } from '../../common/models/target.interface';
import { ITester } from '../../common/models/tester.interfaces';

const defaultPreferences = {
  internalLinksLowerCase: true,
  internalLinksTrailingSlash: true,
};

export const rules: IRule[] = [
  {
    name: 'Canonical Tag',
    description: `Validates that the canonical tag is well formed, that there isn't multiple, and that it matches the url crawled.`,
    success: false,
    errors: [],
    warnings: [],
    info: [],
    testData: {
      preferences: defaultPreferences,
      response: {
        url: 'http://localhost:3000',
      },
      result: {
        canonical: [{ rel: 'canonical', href: 'http://localhost:3000', innerText: '', innerHTML: '' }],
      },
    },
    validator: async (payload, tester) => {
      const canonicals = payload.result.canonical;
      tester.compareTest(Helper.getComparaisonTestParameters(
        100,
        assert.strictEqual,
        canonicals.length,
        1,
        `There should be 1 and only 1 canonical tag, currently there are ${canonicals.length}`,
        IUserTarget.developer, 
        "Canonical Tag"
      ));
      if (canonicals[0]) {
        const { url, host } = payload.response;
        tester.BooleanTest(Helper.getBooleanTestParameters(
          100,
          assert.ok,
          canonicals[0].href.includes('http') && canonicals[0].href.includes(host) && canonicals[0].href.includes(url),
          `Canonical should match absolute url and match the url that was crawled. host:${host} | crawled: ${url} | canonical: ${canonicals[0].href}`,
          IUserTarget.developer,
          canonicals[0].href,
        ));
      }
    },
  },
  {
    name: 'Title tag',
    description: `Validate that the title tag exists, isn't too long, and isn't too short.`,
    success: false,
    errors: [],
    warnings: [],
    info: [],
    testData: {
      preferences: defaultPreferences,
      result: {
        title: [
          {
            innerText: '',
            innerHTML: '',
          },
        ],
      },
    },
    validator: async (payload, tester: ITester) => {
      const titles = payload.result.title;

      tester.compareTest(Helper.getComparaisonTestParameters(
        100,
        assert.strictEqual,
        titles.length,
        1,
        `There should only one and only 1 title tag, currently there are ${titles.length}`,
        IUserTarget.developer,
        "TITLE"
      ));

      if (titles.length !== 1) return;

      if (titles[0]) {

        tester.compareTest(Helper.getComparaisonTestParameters(
          90,
          assert.strictEqual,
          titles[0].innerText,
          titles[0].innerHTML,
          'The title tag should not wrap other tags. (innerHTML and innerText should match)',
          IUserTarget.developer,
          "TITLE",
          titles[0].innerText
        ));

        tester.compareTest(
          Helper.getComparaisonTestParameters(
            100,
            assert.notStrictEqual,
            titles[0].innerText.length,
            0,
            'Title tags should not be empty',
            IUserTarget.both,
            "TITLE"
          ));

        tester.BooleanTest(Helper.getBooleanTestParameters(
          100,
          assert.ok,
          !titles[0].innerText.includes('undefined'),
          `Title tag includes "undefined"`,
          IUserTarget.both,
          "TITLE",
          titles[0].innerText,
        ));

        tester.BooleanTest(Helper.getBooleanTestParameters(
          100,
          assert.ok,
          !titles[0].innerText.includes('null'),
          `Title tag includes "null"`,
          IUserTarget.both,
          "TITLE",
          titles[0].innerText
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          30,
          assert.ok,
          titles[0].innerText.length > 10,
          'This title tag is shorter than the recommended minimum limit of 10.',
          IUserTarget.contentManager,
          "TITLE",
          titles[0].innerText
        ));

        tester.BooleanLint(
          Helper.getBooleanTestParameters(
            30,
            assert.ok,
            titles[0].innerText.length < 70,
            'This title tag is longer than the recommended limit of 70.',
            IUserTarget.contentManager,
            "TITLE",
            titles[0].innerText
          ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          60,
          assert.ok,
          titles[0].innerText.length < 200,
          `Something could be wrong this title tag is over 200 chars. : ${titles[0].innerText}`,
          IUserTarget.contentManager,
          "TITLE",
          titles[0].innerText
        ));

        //TODO localize this part.
        const stopWords = ['a', 'and', 'but', 'so', 'on', 'or', 'the', 'was', 'with'];
        stopWords.forEach((sw) => {
          tester.BooleanLint(Helper.getBooleanTestParameters(
            20,
            assert.ok,
            titles[0].innerText.toLowerCase().indexOf(` ${sw} `),
            `Title tag includes stopword ${sw}`,
            IUserTarget.contentManager,
            "TITLE",
            titles[0].innerText
          ));
        });
      }
    },
  },
  {
    name: 'Meta description',
    description: `Validate that a meta description exists, isn't too long, isn't too short, and uses at least a few keywords from the title.`,
    success: false,
    errors: [],
    warnings: [],
    info: [],
    testData: {
      preferences: defaultPreferences,
      result: {
        meta: [
          {
            name: 'description',
            content: 'Mantis shrimps, or stomatopods, are marine crustaceans of the order Stomatopoda. Some species have specialised calcified "clubs" that can strike with great power, while others have sharp forelimbs used to capture prey.',
          },
        ],
        title: [
          {
            innerText: 'This shrimp is awesome | Strapi Blog',
            innerHTML: 'This shrimp is awesome | Strapi Blog',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      const metas = payload.result.meta.filter((m) => m.name && m.name.toLowerCase() === 'description');

      tester.BooleanTest(Helper.getBooleanTestParameters(
        90,
        assert.ok,
        metas.length === 1,
        `There should be 1 and only 1 meta description. Currently there are ${metas.length}`,
        IUserTarget.developer,
        "META"
      ));

      if (metas[0]) {
        tester.BooleanTest(Helper.getBooleanTestParameters(
          90,
          assert.ok,
          metas[0] && metas[0].content,
          'Meta description content="" should not be missing.',
          IUserTarget.developer,
          "META"
        ));

        tester.compareTest(Helper.getComparaisonTestParameters(
          90,
          assert.notStrictEqual,
          metas[0].content.length,
          0,
          'Meta description should not be empty',
          IUserTarget.contentManager,
          "META"
        ));

        tester.BooleanTest(Helper.getBooleanTestParameters(
          100,
          assert.ok,
          !metas[0].content.includes('undefined'),
          `Meta description includes "undefined"`,
          IUserTarget.both,
          "META",
          metas[0].content
        ));

        tester.BooleanTest(Helper.getBooleanTestParameters(
          100,
          assert.ok,
          !metas[0].content.includes('null'),
          `Meta description includes "null"`,
          IUserTarget.both,
          "META",
          metas[0].content
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          20,
          assert.ok,
          metas[0].content.length > 10,
          `This meta description is shorter than the recommended minimum limit of 10. (${metas[0].content})`,
          IUserTarget.contentManager,
          "META",
          metas[0].content
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          30,
          assert.ok,
          metas[0].content.length < 120,
          `This meta description is longer than the recommended limit of 120. ${metas[0].content.length} (${metas[0].content})`,
          IUserTarget.contentManager,
          "META",
          metas[0].content
        ));

        tester.BooleanTest(Helper.getBooleanTestParameters(
          40,
          assert.ok,
          metas[0].content.length < 300,
          'Investigate this meta description. Something could be wrong as it is over 300 chars.',
          IUserTarget.contentManager,
          "META",
          metas[0].content
        ));

        if (payload.result.title[0]) {
          const titleArr = Helper.cleanString(payload.result.title[0].innerText)
            .split(' ')
            .filter((i) => [':', '|', '-'].indexOf(i) === -1);

          const compareArr = Helper.cleanString(metas[0].content)
            .split(' ')
            .filter((i) => [':', '|', '-'].indexOf(i) === -1);

          const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);

          tester.BooleanLint(Helper.getBooleanTestParameters(
            70,
            assert.ok,
            matches.length >= 1,
            'Meta description should include at least 1 of the words in the title tag.',
            IUserTarget.contentManager,
            "META",
            metas[0].content
          ));
        }
      }
    },
  },
  {
    name: 'HTags',
    description: `Validate that H tags are being used properly.`,
    success: false,
    errors: [],
    warnings: [],
    info: [],
    testData: {
      preferences: defaultPreferences,
      result: {
        title: [
          {
            innerText: 'This shrimp is awesome | Strapi Blog',
            innerHTML: 'This shrimp is awesome | Strapi Blog',
          },
        ],
        h1s: [{ innerText: 'Shrimp is Great', innerHTML: 'Shrimp is Great' }],
        h2s: [{ innerText: 'Receipt of Curry Shrimp', innerHTML: 'Receipt of Curry Shrimp' }],
        h3s: [
          {
            innerText: "Now, how thow thing about Shrimp?",
            innerHTML: "Now, how thow thing about Shrimp?",
          },
        ],
        h4s: [],
        h5s: [],
        h6s: [],
      },
    },
    validator: async (payload, tester) => {
      const { h1s, h2s, h3s, h4s, h5s, h6s, title, html } = payload.result;

      tester.BooleanTest(Helper.getBooleanTestParameters(
        90,
        assert.ok,
        h1s.length === 1,
        `There should be 1 and only 1 H1 tag on the page. Currently: ${h1s.length}`,
        IUserTarget.developer,
        "H1",
        h1s[0] ? h1s[0].innerText : ""
      ));

      let titleArr;
      if (title[0]) {
        titleArr = Helper.cleanString(title[0].innerText)
          .split(' ')
          .filter((i) => [':', '|', '-'].indexOf(i) === -1);
      }

      if (h1s[0]) {

        tester.compareTest(Helper.getComparaisonTestParameters(
          90,
          assert.notStrictEqual,
          h1s[0].innerText.length,
          0,
          'H1 tags should not be empty',
          IUserTarget.contentManager,
          "H1",
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          30,
          assert.ok,
          h1s[0].innerText.length < 70,
          `H1 tag is longer than the recommended limit of 70. (${h1s[0].innerText})`,
          IUserTarget.contentManager,
          "H1",
          h1s[0].innerText
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          30,
          assert.ok,
          h1s[0].innerText.length > 10,
          `H1 tag is shorter than the recommended limit of 10. (${h1s[0].innerText})`,
          IUserTarget.contentManager,
          "H1",
          h1s[0].innerText
        ));

        if (titleArr) {
          const compareArr = Helper.cleanString(h1s[0].innerText)
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
            h1s[0].innerText
          ));
        }
      } else {

        tester.BooleanTest(Helper.getBooleanTestParameters(
          90,
          assert.ok,
          h2s.length === 0,
          `No h1 tag, but h2 tags are defined.`,
          IUserTarget.developer,
          "H1",
          h2s[0] ? h2s[0].innerText : ""
        ));

        tester.BooleanTest(Helper.getBooleanTestParameters(
          90,
          assert.ok,
          h3s.length === 0,
          `No h1 tag, but h3 tags are defined.`,
          IUserTarget.developer,
          "H1",
          h3s[0] ? h3s[0].innerText : ""
        ));
      }

      let usesKeywords = false;
      h2s.forEach((h2) => {
        tester.compareTest(Helper.getComparaisonTestParameters(
          80,
          assert.notEqual,
          h2.innerText.length,
          0,
          'H2 tags should not be empty',
          IUserTarget.contentManager,
          "H2",
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          20,
          assert.ok,
          h2.innerText.length < 100,
          `H2 tag is longer than the recommended limit of 100. (${h2.innerText})`,
          IUserTarget.contentManager,
          "H2",
          h2.innerText
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          30,
          assert.ok,
          h2.innerText.length > 7,
          `H2 tag is shorter than the recommended limit of 7. (${h2.innerText})`,
          IUserTarget.contentManager,
          "H2",
          h2.innerText
        ));

        const compareArr = Helper.cleanString(h2.innerText.toLowerCase())
          .split(' ')
          .filter((i) => [':', '|', '-'].indexOf(i) === -1);

        if (titleArr) {
          const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);
          if (matches.length > 0) {
            usesKeywords = true;
          }
        }
      });

      if (h2s.length > 0 && title[0]) {
        tester.BooleanLint(Helper.getBooleanTestParameters(
          70,
          assert.ok,
          usesKeywords,
          `None of your h2 tags use a single word from your title tag.`,
          IUserTarget.contentManager,
          "H2",
        ));
      }

      usesKeywords = false;
      h3s.forEach((h3) => {

        tester.compareTest(Helper.getComparaisonTestParameters(
          70,
          assert.notStrictEqual,
          h3.innerText.length,
          0,
          'h3 tags should not be empty',
          IUserTarget.both,
          "H3",
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          20,
          assert.ok,
          h3.innerText.length < 100,
          `h3 tag is longer than the recommended limit of 100. (${h3.innerText})`,
          IUserTarget.contentManager,
          "H3",
          h3.innerText
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          20,
          assert.ok,
          h3.innerText.length > 7,
          `h3 tag is shorter than the recommended limit of 7. (${h3.innerText})`,
          IUserTarget.contentManager,
          "H3",
          h3.innerText
        ));

        // const arr = h3.innerText
        //   .toLowerCase()
        //   .split(' ')
        //   .filter((i) => [':', '|', '-'].indexOf(i) === -1);

        // const matches = titleArr.filter((t) => arr.indexOf(t) !== -1);
        // if (matches.length > 0) {
        //   usesKeywords = true;
        // }
      });

      // if (h3s.length > 0) {
      //   tester.lint(
      //     40,
      //     assert.ok,
      //     usesKeywords,
      //     `None of your h3 tags use a single word from your title tag. Investigate.`,
      //   );
      // }

      h4s.forEach((h4) => {
        tester.compareTest(Helper.getComparaisonTestParameters(
          50,
          assert.notEqual,
          h4.innerText.length,
          0,
          'h4 tags should not be empty',
          IUserTarget.both,
          "H4",
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          10,
          assert.ok,
          h4.innerText.length < 100,
          `h4 tag is longer than the recommended limit of 100. (${h4.innerText})`,
          IUserTarget.contentManager,
          "H4",
          h4.innerText
        ));

        tester.BooleanLint(Helper.getBooleanTestParameters(
          10,
          assert.ok,
          h4.innerText.length > 7,
          `h4 tag is shorter than the recommended limit of 7. (${h4.innerText})`,
          IUserTarget.contentManager,
          "H4",
          h4.innerText
        ));
      });

      // check that we aren't overloading the htags or misusing their priority.
      tester.BooleanLint(Helper.getBooleanTestParameters(
        80,
        assert.ok,
        !(h2s.length > 0 && h1s.length === 0),
        `There are h2 tags but no h1 tag. Consider If you can move one of your h2s to an h1.`,
        IUserTarget.developer,
        "H2",
        h2s[0] ? h2s[0].innerText : ""
      ));

      tester.BooleanLint(Helper.getBooleanTestParameters(
        50,
        assert.ok,
        !(h3s.length > 0 && h2s.length === 0),
        `There are h3 tags but no h2 tags. Consider If you can move h3s to h2s.`,
        IUserTarget.developer,
        "H3",
        h3s[0] ? h3s[0].innerText : ""
      ));

      tester.BooleanLint(Helper.getBooleanTestParameters(
        30,
        assert.ok,
        !(h4s.length > 0 && h3s.length === 0),
        `There are h4 tags but no h3 tags. Consider If you can move h4s to h3s.`,
        IUserTarget.developer,
        "H4",
        h4s[0] ? h4s[0].innerText : ""
      ));

      tester.BooleanLint(Helper.getBooleanTestParameters(
        30,
        assert.ok,
        !(h5s.length > 0 && h4s.length === 0),
        `There are h5 tags but no h4 tags. Consider If you can move h5s to h4s.`,
        IUserTarget.developer,
        "H5",
        h5s[0] ? h5s[0].innerText : ""
      ));

      tester.BooleanLint(Helper.getBooleanTestParameters(
        30,
        assert.ok,
        !(h6s.length > 0 && h5s.length === 0),
        `There are h6 tags but no h5 tags. Consider If you can move h6s to h5s.`,
        IUserTarget.developer,
        "H6",
        h6s[0] ? h6s[0].innerText : ""
      ));
    },
  },
  {
    name: 'Viewport with Initial Scale 1.0',
    description:
      'Page has a <meta name="viewport" content="width=device-width, initial-scale=1.0" />. This will allow users to zoom on your mobile page but won\'t be zoomed in by default.',
    testData: {
      preferences: defaultPreferences,
      response: {
        meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
      },
    },
    validator: async (payload, tester) => {
      const viewport = payload.result.meta.find((m) => m.name === 'viewport');
      if (viewport) {
        tester.BooleanTest(Helper.getBooleanTestParameters(
          100,
          assert.ok,
          !!viewport,
          `Meta viewport should be defined`,
          IUserTarget.developer,
          "Viewport",
        ));
        tester.BooleanLint(Helper.getBooleanTestParameters(
          90,
          assert.ok,
          !!viewport.content,
          `Meta viewport has a content attribute`,
          IUserTarget.developer,
          "Viewport",
        ));
        tester.BooleanLint(Helper.getBooleanTestParameters(
          90,
          assert.ok,
          viewport.content.includes('width=device-width'),
          `Meta viewport content includes width=device-width`,
          IUserTarget.developer,
          "Viewport",
        ));
        tester.BooleanLint(Helper.getBooleanTestParameters(
          90,
          assert.ok,
          viewport.content.includes('initial-scale=1'),
          `Meta viewport content may want to include initial-scale=1`,
          IUserTarget.developer,
          "Viewport",
        ));
      }
    },
  },
  {
    name: 'Images',
    description: 'Checks for alt tags on images.',
    success: false,
    errors: [],
    warnings: [],
    info: [],
    testData: {
      preferences: defaultPreferences,
      response: {
        ok: true,
        url: 'https//localhost:3000',
      },
      result: {
        imgs: [
          {
            tag: 'img',
            innerHTML: '',
            innerText: '',
            src: 'https://elderguide.com/images/elderjs-hooks-v100.png',
            alt: 'Elder.js hook Lifecycle',
            style: 'max-width:100%; margin:1rem 0;',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      payload.result.imgs.forEach((i) => {
        if (!i.src.includes('data:')) {
          tester.BooleanLint(Helper.getBooleanTestParameters(
            100,
            assert.ok,
            i.alt && i.alt.length > 0,
            `Images should have alt tags.`,
            IUserTarget.both,
            "IMG",
            i.src
          ));
        }
      });
    },
  }
  /*{
    name: 'Internal Links are well formed',
    description: 'Checks that all internal links are lowercase and have a trailing slash',
    testData: {
      preferences: defaultPreferences,
      response: {

        ok: true,
        url: 'https://nicholasreese.com/',
      },

      result: {
        aTags: [
          {
            tag: 'a',
            innerHTML: '← Home',
            innerText: '← Home',
            href: '/',
            class: 'svelte-bvr7j8',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      const internal = payload.result.aTags
        .filter((l) => (payload.response.host && l.href && l.href.includes(payload.response.host)) || l.href && !l.href.includes('http'))
        .map((l) => {
          if (l.href.includes('#')) {
            l.href = l.href.split('#')[0];
          }
          return l;
        })
        .filter((l) => !l.href.includes('mailto') && l.href.length > 0);
      if (payload.preferences.internalLinksLowerCase) {
        internal.forEach((l) => {
          tester.lint(
            80,
            assert.ok,
            l.href === l.href.toLowerCase(),
            `Internal links should be lowercase: [${l.innerText}](${l.href}) is not.`,
          );
        });
      }

      if (payload.preferences.internalLinksTrailingSlash) {
        internal.forEach((l) => {
          tester.lint(
            80,
            assert.ok,
            l.href.endsWith('/'),
            `Internal links should include a trailing slash: [${l.innerText}](${l.href}) does not.`,
          );
        });
      }

      internal.forEach((l) => {
        tester.test(
          100,
          assert.ok,
          l.ref !== 'nofollow',
          `Internal nofollow links are bad news. [${l.innerText}](${l.href})`,
        );
      });

      internal
        .filter((l) => l.href.includes('http'))
        .forEach((l) => {
          tester.test(
            assert.ok,
            l.href.includes('https'),
            `Internal links should use https: [${l.innerText}](${l.href}) does not.`,
          );
          tester.test(
            100,
            assert.ok,
            !l.href.includes('.html'),
            `Internal links should not link to .html documents: [${l.innerText}](${l.href}) does.`,
          );
        });
    },
  },
  {
    name: 'Outbound links',
    description: 'Checks for the number of outbound links',
    testData: {
      preferences: defaultPreferences,
      response: {
        ok: true,
        url: 'https://nicholasreese.com/',
      },

      result: {
        aTags: [
          {
            tag: 'a',
            innerHTML: '← Home',
            innerText: '← Home',
            href: '/',
            class: 'svelte-bvr7j8',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      const external = payload.result.aTags.filter(
        (l) => l.href && !l.href.includes(payload.response.host) && l.href.includes('http'),
      );

      tester.lint(assert.ok, external.length < 50, `Heads up, this page has more than 50 outbound links.`);
    },
  }*/
];
