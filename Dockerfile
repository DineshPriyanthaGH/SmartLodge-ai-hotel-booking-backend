
FROM node:18-alpine


WORKDIR /app


COPY package*.json ./


RUN npm ci --only=production && npm cache clean --force


RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001


COPY . .


RUN mkdir -p uploads && chown -R nodejs:nodejs uploads


RUN mkdir -p logs && chown -R nodejs:nodejs logs


RUN chown -R nodejs:nodejs /app


USER nodejs


EXPOSE 3000


HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"


CMD ["npm", "start"]