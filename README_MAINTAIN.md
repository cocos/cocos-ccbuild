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

We used monorepo but only `@cocos/ccbuild` is public project, every time we need to publish, we need to deploy the project first.
Please remember to version your package before you deploy and publish it.

```sh

# this would collect all private project together, and generate one project in 'deploy' folder
npm run deploy

# if you got a publish authorization, then you could publish the package in 'deploy' folder
cd ./deploy/
npm publish
```

