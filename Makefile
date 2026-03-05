SHELL := /bin/zsh
NVM_DIR ?= $(HOME)/.nvm
NODE_VERSION ?= v24.14.0
PORT ?= 3210
UI_URL := http://127.0.0.1:$(PORT)

.PHONY: setup ui ui-headless cli test

setup:
	@source "$(NVM_DIR)/nvm.sh" && \
		nvm use --silent $(NODE_VERSION) >/dev/null && \
		npm install

ui:
	@source "$(NVM_DIR)/nvm.sh" && \
		nvm use --silent $(NODE_VERSION) >/dev/null && \
		( sleep 1 && open "$(UI_URL)" ) & \
		PORT=$(PORT) npm run web

ui-headless:
	@source "$(NVM_DIR)/nvm.sh" && \
		nvm use --silent $(NODE_VERSION) >/dev/null && \
		PORT=$(PORT) npm run web

cli:
	@source "$(NVM_DIR)/nvm.sh" && \
		nvm use --silent $(NODE_VERSION) >/dev/null && \
		node ./src/uthana_text2fbx.js $(ARGS)

test:
	@source "$(NVM_DIR)/nvm.sh" && \
		nvm use --silent $(NODE_VERSION) >/dev/null && \
		npm test
