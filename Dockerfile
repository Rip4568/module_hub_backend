# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache postgresql-client

FROM base AS deps
COPY package.json package-lock.json ./
# Husky é devDependency — não rodar prepare/lifecycle hooks no build da imagem
ENV HUSKY=0
RUN npm ci --ignore-scripts

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS production
# Manter devDependencies (ts-node/typeorm) para migrations no entrypoint
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
# ts-node evita ReferenceError de imports circulares entre entidades no CJS compilado pelo SWC
CMD ["npx", "ts-node", "-r", "tsconfig-paths/register", "src/main.ts"]
