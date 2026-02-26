ENV_LOCAL := .env.local

# Load .env.local if it exists
ifneq (,$(wildcard $(ENV_LOCAL)))
  include $(ENV_LOCAL)
  export
endif

.PHONY: login logout whoami

## Login to OpenShift cluster using credentials from .env.local
login:
	@if [ -z "$(OCP_SERVER)" ]; then \
		echo "❌  OCP_SERVER is not set in $(ENV_LOCAL)"; exit 1; \
	fi
	@if [ -n "$(OCP_TOKEN)" ]; then \
		echo "🔐  Logging in with token to $(OCP_SERVER)..."; \
		oc login --token="$(OCP_TOKEN)" --server="$(OCP_SERVER)" --insecure-skip-tls-verify=false; \
	elif [ -n "$(OCP_USERNAME)" ] && [ -n "$(OCP_PASSWORD)" ]; then \
		echo "🔐  Logging in as $(OCP_USERNAME) to $(OCP_SERVER)..."; \
		oc login --username="$(OCP_USERNAME)" --password="$(OCP_PASSWORD)" --server="$(OCP_SERVER)"; \
	else \
		echo "❌  Set either OCP_TOKEN or both OCP_USERNAME and OCP_PASSWORD in $(ENV_LOCAL)"; exit 1; \
	fi

## Logout from the current OpenShift session
logout:
	oc logout

## Show the currently logged-in user
whoami:
	oc whoami
