package utils

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var Validate = validator.New()

func generateMsgForField(fe validator.FieldError, v any) (string, string) {
	t := reflect.TypeOf(v)

	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	field, _ := t.FieldByName(fe.StructField())

	jsonTag := field.Tag.Get("json")
	if field, ok := t.FieldByName(fe.StructField()); ok {
		if tag := field.Tag.Get("json"); tag != "" && tag != "-" {
			jsonTag = strings.Split(tag, ",")[0]
		}
	}

	switch fe.Tag() {
	case "required":
		return jsonTag, fmt.Sprintf("`%s` is required", jsonTag)
	case "email":
		return jsonTag, fmt.Sprintf("`%s` must be a valid email address", jsonTag)
	case "min":
		switch fe.Kind() {
		case reflect.String:
			return jsonTag, fmt.Sprintf("`%s` should contain at least %s characters", jsonTag, fe.Param())
		case reflect.Slice, reflect.Array:
			return jsonTag, fmt.Sprintf("`%s` should contain at least %s item(s)", jsonTag, fe.Param())
		default:
			return jsonTag, fmt.Sprintf("`%s` should be at least %s", jsonTag, fe.Param())
		}
	case "max":
		switch fe.Kind() {
		case reflect.String:
			return jsonTag, fmt.Sprintf("`%s` should contain at most %s characters", jsonTag, fe.Param())
		case reflect.Slice, reflect.Array:
			return jsonTag, fmt.Sprintf("`%s` should contain at most %s item(s)", jsonTag, fe.Param())
		default:
			return jsonTag, fmt.Sprintf("`%s` should be at most %s", jsonTag, fe.Param())
		}
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
	}

	return fe.Field(), fe.Error()
}

func GenerateValidationErrorObject(ve validator.ValidationErrors, v any) map[string]string {
	errs := map[string]string{}
	for _, fe := range ve {
		key, value := generateMsgForField(fe, v)
		errs[key] = value
	}
	return errs
}
