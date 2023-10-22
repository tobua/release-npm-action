# Build Notes

Since both `esbuild` and `ncc` weren't able to bundle the external dependencies the `node_modules` folder with the required dependencies is checked into source-control. The dependencies will be created along with the regular build script. The problematic parts were dynamic requires which cannot be resolved at build time along with `require.resolve` statements which also cannot be resolved during build time. `ncc` can only generate an ESM build from an ESM initial project.

`semantic-release` and `@actions/core` are currently the only dependencies with issues the others can be bundled well. Their versions have to be updated manually in `dist/package.json`.
