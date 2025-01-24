

# mac builds
build-arm-mac:
	bun build --compile --target=bun-darwin-arm64 app.js --outfile git-addons

build-intel-mac:
	bun build --compile --target=bun-darwin-x64 app.js --outfile git-addons
