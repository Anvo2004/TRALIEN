# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Note: Zalo Mini App is usually built with Vite (npm run build) and outputs to www/ or dist/
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# ZMP outputs to 'www' or 'dist', we'll assume standard Vite output 'dist' or 'www'
# We copy 'www' if it exists, or 'dist' if it doesn't. 
# Typically zmp-cli outputs to 'www', so we copy that. If it's pure vite it outputs to 'dist'.
# We can just copy everything from the build context and let nginx serve it, 
# but specifically we need to find where Vite outputs.
# According to ZMP standard, it's usually `www`
COPY --from=build /app/www /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
