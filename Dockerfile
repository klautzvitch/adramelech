FROM oven/bun:alpine AS base
WORKDIR /app

FROM base as dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Install Doppler CLI
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add doppler

FROM base as build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base as release
COPY --from=build /app/dist dist

ENTRYPOINT ["doppler", "run", "--"]
CMD ["./dist"]