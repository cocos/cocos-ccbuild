# CCBUILD

The next generation of build tool for Cocos engine.

# What problems does this build tool solve ?

- To merge `@editor/quick-compiler` and  `@cocos/build-engine`
- To support build cache management
- To support generating ts engine for AOT optimization on Open Harmony 
- To support API generation
- To support API report
- To support API document model generation
- To support build modular engine
- More human-friendly log info

# How to maintain this repo

Run `npm i` to setup the dev environment.

## unit test

Every time you fix a bug or introduce a new feature to ccbuild, please remember considering to add your unit test into `test` folder, and run `npm test` to make sure all your modification can pass the unit test.  

If you want to update the snapshot, please run `npm test -- -u`.

## changelog generation

We use [changesets](https://github.com/changesets/changesets) to manage all the changelog.
Every time you make a change in the repo, please run `npm run change` to generate a changeset in the folder `.changeset`, this file should be also commit to the repo.

## publish

Please run `npm run version` to publish a version, this command would consume all the changesets in `.changeset` folder.  
If you wan't to publish an alpha version, please use `npm run version-alpha`, this command won't consume any of the changesets.

And finally, run `npm publish` before your npm account got a publish authorization.

