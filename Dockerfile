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

ARG LOCAL_VITE_API_URL
ARG LOCAL_VITE_WS_URL
ARG LOCAL_VITE_ACOMPANHAMENTO_URL
ARG LOCAL_VITE_IA_API_URL
ARG HML_VITE_API_URL
ARG HML_VITE_WS_URL
ARG HML_VITE_ACOMPANHAMENTO_URL
ARG HML_VITE_IA_API_URL
ARG VITE_TOMTOM_API_KEY

COPY . .

RUN test -n "$LOCAL_VITE_API_URL" \
    && test -n "$LOCAL_VITE_WS_URL" \
    && test -n "$LOCAL_VITE_ACOMPANHAMENTO_URL" \
    && test -n "$LOCAL_VITE_IA_API_URL" \
    && test -n "$HML_VITE_API_URL" \
    && test -n "$HML_VITE_WS_URL" \
    && test -n "$HML_VITE_ACOMPANHAMENTO_URL" \
    && test -n "$HML_VITE_IA_API_URL" \
    && VITE_API_URL="$LOCAL_VITE_API_URL" \
       VITE_WS_URL="$LOCAL_VITE_WS_URL" \
       VITE_ACOMPANHAMENTO_URL="$LOCAL_VITE_ACOMPANHAMENTO_URL" \
       VITE_IA_API_URL="$LOCAL_VITE_IA_API_URL" \
       VITE_TOMTOM_API_KEY="$VITE_TOMTOM_API_KEY" \
       npm run build -- --outDir dist-local \
    && VITE_API_URL="$HML_VITE_API_URL" \
       VITE_WS_URL="$HML_VITE_WS_URL" \
       VITE_ACOMPANHAMENTO_URL="$HML_VITE_ACOMPANHAMENTO_URL" \
       VITE_IA_API_URL="$HML_VITE_IA_API_URL" \
       VITE_TOMTOM_API_KEY="$VITE_TOMTOM_API_KEY" \
       npm run build -- --outDir dist-hml


FROM nginx:1.28-alpine AS runner

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist-local /usr/share/nginx/html/local
COPY --from=build /app/dist-hml /usr/share/nginx/html/hml

EXPOSE 8080

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=5s \
    --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/health || exit 1
