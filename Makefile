###########################################################
# nodejs build script
###########################################################

# Operating System (darwin or linux)
PLATFORM:=$(shell uname | tr A-Z a-z)
ARCH=x64
PROJECT_ROOT=$(shell git rev-parse --show-toplevel)
PROJECT_NAME=nomplate-router

# Nodejs
# https://nodejs.org/dist/v10.9.0/node-v10.9.0-linux-x64.tar.xz
NODE_VERSION=18.12.1
NODE=lib/nodejs/bin/node
NPM=lib/nodejs/bin/npm

# Derived values
NODE_FILENAME=node-v$(NODE_VERSION)-$(PLATFORM)-$(ARCH)
TEST_FILES=`find . -name "*_test.js" ! -path "*node_modules*"`
NODE_MODULES_BIN=node_modules/.bin

# Node utilities
ESLINT=$(NODE_MODULES_BIN)/eslint
MOCHA=$(NODE_MODULES_BIN)/_mocha
ESBUILD=$(NODE_MODULES_BIN)/esbuild

.PHONY: test test-w dev-install build build-module lint clean

build: dist/$(PROJECT_NAME).js dist/$(PROJECT_NAME).min.js dist/$(PROJECT_NAME).min.gz

# Run all JavaScript tests
test: ${NODE}
	${MOCHA} --reporter dot ${TEST_FILES}

test-w: ${NODE}
	${MOCHA} --reporter dot ${TEST_FILES} -w

# Open a new chrome tab at chrome://inspect and click the small blue link
# that says, "Open dedicated DevTools for Node."
test-debug: ${NODE}
	${MOCHA} --inspect-brk

build-module: src/index.js

publish: clean build
	npm publish

dist/$(PROJECT_NAME).js: src/index.js src/*
	esbuild src/index.js --define:global=window --sourcemap --bundle --target=chrome58,firefox57,safari11,edge16 --outfile=dist/$(PROJECT_NAME).js

dist/$(PROJECT_NAME).min.js: src/index.js src/*
	esbuild src/index.js --define:global=window --bundle --minify --target=chrome58,firefox57,safari11,edge16 --outfile=dist/$(PROJECT_NAME).min.js

dist/$(PROJECT_NAME).min.gz: dist/$(PROJECT_NAME).min.js
	gzip --best -c dist/$(PROJECT_NAME).min.js > dist/$(PROJECT_NAME).min.gz

lint:
	$(ESLINT) --config $(PROJECT_ROOT)/.eslintrc.json .

module-install:
	$(NPM) install

integrate: clean lint test build

clean:
	rm -rf dist
	rm -rf tmp
	rm -f .tmp-view.html

# Intall development dependencies (OS X and Linux only)
dev-install: $(NODE) $(NODE_MODULES_BIN)

# Download and unpack the Node binaries into lib/nodejs.
$(NODE):
	mkdir -p tmp
	wget -O tmp/nodejs.tar.xz --no-check-certificate "https://nodejs.org/dist/v$(NODE_VERSION)/$(NODE_FILENAME).tar.xz"
	touch tmp/nodejs.tar.xz
	mkdir -p lib/nodejs
	tar -xvf tmp/nodejs.tar.xz -C lib/nodejs --strip 1
	touch lib/nodejs/README.md
	rm -rf tmp

# Install npm dependencies
$(NODE_MODULES_BIN): $(PROJECT_ROOT)/package.json
	$(NPM) upgrade -g npm
	$(NPM) install --development

