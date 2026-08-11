# --- Build stage ---
FROM golang:1.26-alpine AS build

WORKDIR /src

# Cache dependencies first (only go.mod/go.sum change rarely).
COPY go.mod go.sum* ./
RUN go mod download

# Build the statically-linked binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# --- Runtime stage ---
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=build /out/api /app/api

EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/api"]
