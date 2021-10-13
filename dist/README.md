# Build Notes

`conventional-changelog-core` includes a dynamic import that cannot automatically be bundled with esbuild, the required file has therefore manually been added in `/hosts/github.json` so that the import is successful.
