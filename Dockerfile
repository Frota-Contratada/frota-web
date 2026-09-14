FROM node:22.22.3-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM base AS dev

ENV NODE_ENV=development

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]


FROM base AS build

ARG VITE_API_URL=""
ARG VITE_WS_URL=""
ARG VITE_ACOMPANHAMENTO_URL=""
ARG VITE_IA_API_URL=""
ARG VITE_TOMTOM_API_KEY=""

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_ACOMPANHAMENTO_URL=${VITE_ACOMPANHAMENTO_URL}
ENV VITE_IA_API_URL=${VITE_IA_API_URL}
ENV VITE_TOMTOM_API_KEY=${VITE_TOMTOM_API_KEY}

COPY . .

RUN npm run build


FROM nginx:1.28-alpine AS runner

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=5s \
    --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/health || exit 1
