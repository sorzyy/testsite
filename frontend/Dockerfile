FROM --platform=$BUILDPLATFORM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* .
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
