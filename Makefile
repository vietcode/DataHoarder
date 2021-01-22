

bot.pid: index.js $(wildcard commands/*.js)
	@echo "Restarting bot"
	@if [ -e bot.pid ]; then \
    kill -TERM $$(cat bot.pid) || true; \
	fi;

	@node . & echo $$! > bot.pid

watch: ## Simple interval-polling watcher that will run `make` when there is something to be done.
	@while true; do $(MAKE) -q || $(MAKE); sleep 0.5; done
