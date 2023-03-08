FROM node:14-alpine

WORKDIR /usr/patrikzeros/chatgpt

# Install application dependencies
COPY package*.json ./
RUN npm install && \
    npm cache clean --force && \
    rm -rf /root/.npm /root/.node-gyp && \
    rm -rf /usr/src/app/package-lock.json && \
# Copy application code
COPY . .

# Expose port
EXPOSE 5173

# --host enables network
CMD ["npm", "run", "dev", "--", "--host"]