FROM node:11.6.0-alpine

RUN useradd -s /bin/bash -m -U -u 2000 box
USER box

RUN mkdir -p /home/box/reqres
WORKDIR /home/box/reqres

ADD --chown=box:box package.json yarn.lock ./
RUN yarn install --only=production

COPY --chown=box:box . .

EXPOSE 5000
EXPOSE 5001
CMD [ "node", "app.js" ]
