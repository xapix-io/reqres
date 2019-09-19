FROM node:12.10.0-alpine

RUN addgroup -S box --gid 2000 && adduser -S box -G box --uid 2000
USER box

RUN mkdir -p /home/box/reqres
WORKDIR /home/box/reqres

ADD --chown=box:box package.json yarn.lock ./
RUN yarn install --only=production

COPY --chown=box:box . .

EXPOSE 5000
EXPOSE 5001
CMD [ "node", "app.js" ]
