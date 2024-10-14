# Use the official Node.js image
FROM node:16

# Install dependencies needed for building and running the app
RUN apt-get update && apt-get install -y postgresql-client

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and tsconfig.json
COPY package.json tsconfig.json ./
COPY .env ./

RUN npm install
RUN npm install -g nodemon

EXPOSE 3000

ENTRYPOINT ["bash", "./scripts/entrypoint.sh"]
