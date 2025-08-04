package middlewares

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"go.uber.org/zap"
)

type uploadedFilesKey struct{}

const (
	maxTotalUploadSize = 500 * 1024 * 1024
	fileFieldName      = "files"
)

type UploadedFile struct {
	File        multipart.File
	FileHeader  *multipart.FileHeader
	ContentType string
}

type FileMiddleware struct{}

func NewFileMiddleware() *FileMiddleware {
	return &FileMiddleware{}
}

func (m *FileMiddleware) CheckFilePayload(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Content-Type"), "multipart/form-data") {
			utils.SendAPIErrorResponse(w, http.StatusUnsupportedMediaType,
				fmt.Errorf("invalid content-type, expected \"multipart/form-data\""))
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, maxTotalUploadSize)

		if err := r.ParseMultipartForm(maxTotalUploadSize); err != nil {
			utils.SendAPIErrorResponse(w, http.StatusBadRequest,
				fmt.Errorf("total upload size too large. Max allowed is %dMB. Error: %v", maxTotalUploadSize/1024/1024, err))
			return
		}

		files := r.MultipartForm.File[fileFieldName]
		if len(files) == 0 {
			utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity,
				fmt.Errorf("no files found for field '%s'. Please make sure you've uploaded a file(s)", fileFieldName))
			return
		}

		var uploadedFiles []UploadedFile
		for _, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				config.LOGGER.Error("could not open uploaded file", zap.Error(err))
				utils.SendAPIErrorResponse(w, http.StatusInternalServerError,
					fmt.Errorf("error opening uploaded file '%s': %v", fileHeader.Filename, err))
				return
			}

			processedFile, err := m.processAndValidateFile(file, fileHeader)
			if err != nil {
				file.Close()
				utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, err)
				return
			}

			uploadedFiles = append(uploadedFiles, *processedFile)
		}

		ctx := context.WithValue(r.Context(), uploadedFilesKey{}, uploadedFiles)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (m *FileMiddleware) processAndValidateFile(file multipart.File, fileHeader *multipart.FileHeader) (*UploadedFile, error) {
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		config.LOGGER.Error("error reading file", zap.String("file_name", fileHeader.Filename), zap.Error(err))
		return nil, fmt.Errorf("error reading file '%s': %v", fileHeader.Filename, err)
	}

	contentType := http.DetectContentType(buffer)

	if _, err := file.Seek(0, 0); err != nil {
		config.LOGGER.Error("error rewinding file", zap.String("file_name", fileHeader.Filename), zap.Error(err))
		return nil, fmt.Errorf("error rewinding file '%s': %v", fileHeader.Filename, err)
	}

	return &UploadedFile{
		File:        file,
		FileHeader:  fileHeader,
		ContentType: contentType,
	}, nil
}

func (m *FileMiddleware) GetUploadedFiles(ctx context.Context) ([]UploadedFile, bool) {
	val, ok := ctx.Value(uploadedFilesKey{}).([]UploadedFile)
	return val, ok
}
