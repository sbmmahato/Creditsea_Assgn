# Project Setup Guide

### 1. Start Docker Containers

Start all necessary containers in detached mode:

```bash
docker-compose up -d
```

### 2. Start Backend

```bash
cd backend
npm install
npm run start
```

### 3. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```


