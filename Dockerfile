FROM node:carbon

RUN useradd -s /bin/bash -m -U -u 2000 box
USER box

RUN mkdir -p /home/box/reqres
WORKDIR /home/box/reqres

ADD --chown=box:box package.json package-lock.json ./
RUN npm install --only=production

COPY --chown=box:box . .

EXPOSE 5000
CMD [ "node", "app.js" ]
