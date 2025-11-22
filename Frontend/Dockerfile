FROM node:20

# We want devDependencies (vite) as well
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

WORKDIR /app

# 1) Copy only package.json first (you have no package-lock.json in your JSON)
COPY package.json ./

# 2) Install ALL deps incl. devDependencies
RUN npm install --include=dev

# 3) Copy the rest of the frontend source
COPY . .

EXPOSE 3000

# 4) Run Vite dev server on 0.0.0.0:3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
