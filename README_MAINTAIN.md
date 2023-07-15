# How to maintain this repo

```sh
# setup the dev environment
rush update

# build all packages
rush build

# force build all package without cache
rush rebuild
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

```sh

# this would collect all private project together, and generate one project in 'deploy' folder
npm run deploy

# if you got a publish authorization, then you could publish the package in 'deploy' folder
cd ./deploy/
npm publish
```

