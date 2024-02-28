# How to maintain this repo

please use `npm v7.x` or newer version, because we need the npm's workspaces feature.

```sh
# setup the dev environment
npm i

# build all packages
npm run build
```

## unit test

Every time you fix a bug or introduce a new feature to `@cocos/ccbuild`, please remember considering to add your unit test into `test` folder.

```sh
# run test
npm test

# update the snapshot
npm test -- -u
```

## changelog generation

We use [changesets](https://github.com/changesets/changesets) to manage all the changelog.
Every time you make a change in the repo, please generate a changeset in the folder `.changeset`, this file should be also commit to the repo.

```sh
# generate changelog
npm run change
```

## API generation

Remember to update the public API every time you change the interface.

```sh
# generate API report in '.api' directory
npm run api
```

You can generate API document in this way:

```sh
# use typedoc to generate API document
npm run doc
```

## version the package

Please version the package before you publish.
```sh
# this command would consume all the changesets in `.changeset` folder.  
npm run version

# this command won't consume any of the changesets.
npm run version-alpha
```

## publish

- Update version in package.json
- After code is merged repo, [draft a new release](https://github.com/cocos/cocos-ccbuild/releases/new) with correct version, it will trigger github action runner to run the `deploy` task and push to npm registry. Note that only the people who have the authority could draft a release.
