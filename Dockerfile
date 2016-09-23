FROM debian:jessie
ARG PROXY_URL
ARG SKYTAP_USER
ARG SKYTAP_TOKEN

RUN if [ -z ${PROXY_URL+x} ]; then echo "####PROXY_URL NOT SET####"; \
else \
	export http_proxy=$PROXY_URL \
	&& export https_proxy=$PROXY_URL \
	&& echo "----OS PROXY SET----"; \
fi

#SET ENVIRONMENTAL VARIABES
ENV http_proxy=$PROXY_URL
ENV https_proxy=$PROXY_URL
ENV NVM_NODEJS_ORG_MIRROR=http://nodejs.org/dist
ENV NODE_VERSION=6.5.0
ENV NVM_DIR=/root/.nvm

#CREATE DIRS
RUN mkdir /home/deployweb

RUN echo "oracle-java8-installer shared/accepted-oracle-license-v1-1 select true" | /usr/bin/debconf-set-selections

#MONO REQUIREMENTS
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
RUN echo "deb http://download.mono-project.com/repo/debian wheezy/snapshots/4.2.4 main" | tee /etc/apt/sources.list.d/mono-xamarin.list
RUN echo "deb http://download.mono-project.com/repo/debian wheezy-apache24-compat main" | tee -a /etc/apt/sources.list.d/mono-xamarin.list
RUN echo "deb http://download.mono-project.com/repo/debian wheezy-libjpeg62-compat main" | tee -a /etc/apt/sources.list.d/mono-xamarin.list

RUN echo "deb http://ppa.launchpad.net/webupd8team/java/ubuntu xenial main" | tee /etc/apt/sources.list.d/webupd8team-java.list
RUN echo "deb-src http://ppa.launchpad.net/webupd8team/java/ubuntu xenial main" | tee -a /etc/apt/sources.list.d/webupd8team-java.list
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys EEA14886

#UPDATE SYSTEM AND INSTALL REQUIRED PACKAGES
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y \
	git \
	wget \
	curl \
	build-essential \
	nano \
	python2.7 \
	python \
	libunwind8 \
	gettext \
	oracle-java8-installer \
	oracle-java8-set-default \
	mono-complete

ENV PYTHON=/usr/bin/python2.7

#INSTALL NODE
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh --no-check-certificate | bash
RUN /bin/bash -c "source /root/.bashrc && nvm install $NODE_VERSION && nvm alias default $NODE_VERSION"
ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

#CONFIGURE GIT
RUN if [ -z ${PROXY_URL+x} ]; then echo "####NO PROXY URL SET####"; \
else \
	git config --global http.proxy $PROXY_URL \
	&& git config --global https.proxy $PROXY_URL \
	&& git config --global url."http://".insteadOf git:// \
	&& git config --global http.savecookies true \
	&& echo "----GIT PROXY SET----"; \
fi

#CONFIGURE NPM
RUN if [ -z ${PROXY_URL+x} ]; then echo "####NO PROXY URL SET####"; \
else \
	npm config set proxy $PROXY_URL \
	&& npm config set https-proxy $PROXY_URL \
	&& echo "----NPM PROXY SET----"; \
fi

RUN npm install node-gyp -g
RUN npm install bower -g

#GET CODE
WORKDIR /home/deployweb
RUN git clone https://github.com/fti-technology/ringtail-deploy-web.git
WORKDIR ringtail-deploy-web
RUN mkdir data

#SETUP CONFIG
RUN cp config.js.example config.js
RUN if [ -z ${PROXY_URL+x} ]; then echo "####NO PROXY URL SET####" \
	&& sed -i "s/'SKYTAP_TOKEN',/'SKYTAP_TOKEN'/g" config.js \
	&& sed -i "s/proxy.*[']//g" config.js; \
else \
	sed -i "s,OPTIONAL_PROXY_SETTING,$PROXY_URL,g" config.js \
	&& echo "----SKYTAP PROXY SET----"; \
fi
RUN sed -i "s,SKYTAP_USERNAME,$SKYTAP_USER,g" config.js
RUN sed -i "s,SKYTAP_TOKEN,$SKYTAP_TOKEN,g" config.js


RUN npm install --production
RUN bower install --allow-root

#DON'T RUN MIGRATE UNTIL DOCKER RUN AND VOLUME MOUNTED
RUN touch start.sh && chmod +x start.sh
RUN echo "DEBUG=deployer* npm start" >> start.sh

#EXPOSE PORTS
EXPOSE 8080
EXPOSE 5858

#START APP
CMD [ "sh", "start.sh" ]
