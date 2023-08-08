# Set image. Stage 1: build stage
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install needed packages in package.json
RUN npm install

# Copy app source inside the docker image
COPY . .

# Build the app
RUN npm run build


# Stage 2: Production stage
FROM node:18

# Install ffmpeg in the container
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy build app from the stage 1
COPY --from=builder /app/dist ./dist

# Make port 3000 available
EXPOSE 3000

# Define the command to run the app
CMD [ "npm", "run", "serve"]