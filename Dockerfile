FROM node:20-slim

RUN apt-get update && apt-get install -y \
  chromium fonts-liberation libnss3 libxss1 libasound2 && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 3000
CMD ["npm", "start"]
