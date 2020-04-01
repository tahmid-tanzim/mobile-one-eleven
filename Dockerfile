FROM node:12.4.0

ENV APP_DIR /mobile-one-eleven

RUN mkdir -p ${APP_DIR}
WORKDIR APP_DIR

ADD . .

RUN npm install

ENTRYPOINT [ "npm", "start" ]
