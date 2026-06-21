# 1. Use a specific LTS Alpine image
FROM node:20-alpine

# 2. Set environment to production
ENV NODE_ENV=production

# 3. Create app directory and change ownership to the non-root 'node' user
WORKDIR /usr/src/app
RUN chown -R node:node /usr/src/app

# 4. Switch to the non-root user for security
USER node

# 5. Copy package manifests first to optimize Docker build caching
# The --chown flag ensures the 'node' user owns the copied files
COPY --chown=node:node package*.json ./

# 6. Install exact dependencies from package-lock.json, omitting devDependencies
RUN npm ci --omit=dev

# 7. Copy the rest of your application code
COPY --chown=node:node . .

# 8. Expose the port your server binds to (defaulting to 3000)
EXPOSE 3000

# 9. Start the app directly using node
CMD ["node", "src/server.js"]