package utils

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var ErrNoEmptyReqBody = errors.New("request body cannot be empty")

var Validate = validator.New()

func generateMsgForField(fe validator.FieldError, v any) (string, string) {
	jsonTag := extractJSONTag(fe, v)
	fieldName, message := generateValidationMessage(fe, jsonTag)

	return fieldName, message
}

func extractJSONTag(fe validator.FieldError, v any) string {
	t := reflect.TypeOf(v)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	field, ok := t.FieldByName(fe.StructField())
	if !ok {
		return fe.StructField()
	}

	tag := field.Tag.Get("json")
	if tag == "" || tag == "-" {
		return fe.StructField()
	}

	return strings.Split(tag, ",")[0]
}

func generateValidationMessage(fe validator.FieldError, jsonTag string) (string, string) {
	switch fe.Tag() {
	case "required":
		return jsonTag, fmt.Sprintf("`%s` is required", jsonTag)
	case "email":
		return jsonTag, fmt.Sprintf("`%s` must be a valid email address", jsonTag)
	case "min":
		return jsonTag, generateMinMessage(fe, jsonTag)
	case "max":
		return jsonTag, generateMaxMessage(fe, jsonTag)
	case "dive":
		return jsonTag, fmt.Sprintf("`%s` should be in an array", jsonTag)
	case "oneof":
		return jsonTag, fmt.Sprintf("`%s` should be one of [%s]", jsonTag, fe.Param())
	case "alphanum":
		return jsonTag, fmt.Sprintf("`%s` should be alpha numerical", jsonTag)
	case "lowercase":
		return jsonTag, fmt.Sprintf("`%s` should be all lower case", jsonTag)
	case "uuid", "uuid4":
		return fe.StructField(), fmt.Sprintf("`%s` should be a valid UUID", fe.StructField())
	default:
		return fe.Field(), fe.Error()
	}
}

func generateMinMessage(fe validator.FieldError, jsonTag string) string {
	//nolint:exhaustive // handled by default case
	switch fe.Kind() {
	case reflect.String:
		return fmt.Sprintf("`%s` should contain at least %s characters", jsonTag, fe.Param())
	case reflect.Slice, reflect.Array:
		return fmt.Sprintf("`%s` should contain at least %s item(s)", jsonTag, fe.Param())
	default:
		return fmt.Sprintf("`%s` should be at least %s", jsonTag, fe.Param())
	}
}

func generateMaxMessage(fe validator.FieldError, jsonTag string) string {
	//nolint:exhaustive // handled by default case
	switch fe.Kind() {
	case reflect.String:
		return fmt.Sprintf("`%s` should contain at most %s characters", jsonTag, fe.Param())
	case reflect.Slice, reflect.Array:
		return fmt.Sprintf("`%s` should contain at most %s item(s)", jsonTag, fe.Param())
	default:
		return fmt.Sprintf("`%s` should be at most %s", jsonTag, fe.Param())
	}
}

func GenerateValidationErrorObject(ve validator.ValidationErrors, v any) map[string]string {
	errs := map[string]string{}

	for _, fe := range ve {
		key, value := generateMsgForField(fe, v)
		errs[key] = value
	}

	return errs
}

func ParseAndValidate[T any](w http.ResponseWriter, r *http.Request, allowEmpty bool) (T, bool) {
	var payload T

	defer r.Body.Close()

	if err := ParseJSON(r, &payload); err != nil {
		if errors.Is(err, io.EOF) && !allowEmpty {
			SendAPIErrorResponse(
				w,
				http.StatusBadRequest,
				ErrNoEmptyReqBody,
			)

			return payload, false
		}

		return payload, true
	}

	if err := Validate.Struct(payload); err != nil {
		errs := GenerateValidationErrorObject(func() validator.ValidationErrors {
			var target validator.ValidationErrors

			_ = errors.As(err, &target)

			return target
		}(), payload)
		SendAPIErrorResponse(w, http.StatusUnprocessableEntity, errs)

		return payload, false
	}

	return payload, true
}
