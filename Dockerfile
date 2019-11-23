FROM node:10
WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

USER docker
RUN ./nix_install_deps.sh
EXPOSE 8080

CMD ["npm", "start"]
