FROM golang:1.24.4-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY api/go.mod api/go.sum ./

RUN go mod tidy

COPY api .

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

RUN go build -ldflags="-s -w" -o cloudmesh ./cmd/main.go

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /app/cloudmesh /cloudmesh

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/cloudmesh"]