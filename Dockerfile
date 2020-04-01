FROM node:8.10.0

ENV APP_DIR /pay-with-ipay

RUN mkdir -p ${APP_DIR}
WORKDIR APP_DIR

ADD . .

RUN npm install

ENTRYPOINT [ "npm", "start" ]
