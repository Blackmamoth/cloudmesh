package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type APIServer struct {
	host     string
	addr     string
	connPool *pgxpool.Pool
}

func init() {
	clerk.SetKey(config.ClerkConfig.SECRET_KEY)
	config.LOGGER.Info("Clerk secret key set")
}

func NewAPIServer(host, addr string, connPool *pgxpool.Pool) *APIServer {
	return &APIServer{
		host:     host,
		addr:     addr,
		connPool: connPool,
	}
}

func (s *APIServer) Run() error {
	defer config.LOGGER.Sync()
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(middleware.Heartbeat("/health-check"))
	r.Use(middleware.Compress(6, "gzip", "brotli"))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{config.APIConfig.FRONTEND_HOST},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		utils.SendAPIResponse(w, http.StatusOK, map[string]string{
			"message": "Welcome to CloudMesh! Your gateway to effortlessly connecting and managing your cloud storage. Let's get started!",
		})
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		utils.SendAPIErrorResponse(
			w,
			http.StatusNotFound,
			fmt.Sprintf("route not found for [%s] %s", r.Method, r.URL.Path),
		)
	})

	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		utils.SendAPIErrorResponse(
			w,
			http.StatusMethodNotAllowed,
			fmt.Sprintf("method [%s] not allowed for route %s", r.Method, r.URL.Path),
		)
	})

	config.LOGGER.Info(
		"Application started",
		zap.String("host", s.host),
		zap.String("addr", s.addr),
	)

	return http.ListenAndServe(fmt.Sprintf("%s:%s", s.host, s.addr), r)
}
