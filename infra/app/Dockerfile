# syntax = docker/dockerfile:1
# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.11.1
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Remix"

# App lives here
WORKDIR /app

# Install pnpm
ARG PNPM_VERSION=9.11.0
RUN npm install -g pnpm@$PNPM_VERSION

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
  apt-get install -y build-essential pkg-config python-is-python3

# Set production environment
ENV NODE_ENV="production"

# Install node modules
COPY --link package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json drizzle.config.ts .npmrc ./
COPY --link ./packages/app ./packages/app
COPY --link ./packages/common ./packages/common
RUN pnpm install --frozen-lockfile --prod=false

RUN pnpm build

# Remove development dependencies
RUN pnpm prune --prod

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Don't include src files in result
RUN rm -rf packages/app/src
RUN rm -rf packages/common/src
RUN rm -rf packages/common/migrations

ENV PORT 3000
ENV HOST 0.0.0.0
ENV NODE_ENV="production"

EXPOSE 3000
CMD [ "pnpm", "start:app" ]
