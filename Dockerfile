FROM node:8-slim

EXPOSE 8081

# override some config defaults with values that will work better for docker
ENV ME_CONFIG_EDITORTHEME="default" \
	ME_CONFIG_MONGODB_SERVER="mongo" \
	ME_CONFIG_MONGODB_ENABLE_ADMIN="true" \
	ME_CONFIG_BASICAUTH_USERNAME="" \
	ME_CONFIG_BASICAUTH_PASSWORD="" \
	VCAP_APP_HOST="0.0.0.0"

WORKDIR /app

COPY . /app

RUN cp config.default.js config.js

RUN set -x \
	&& apt-get update && apt-get install -y git --no-install-recommends \
	&& npm install \
	&& apt-get purge --auto-remove -y git \
	&& rm -rf /var/lib/apt/lists/*

RUN npm run build

CMD ["npm", "start"]
