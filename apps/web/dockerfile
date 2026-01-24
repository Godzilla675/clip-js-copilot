FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["/bin/sh", "-c", "npm run build && npm start"]
