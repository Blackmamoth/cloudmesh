package utils

import (
	"fmt"
	"reflect"

	"github.com/go-playground/validator/v10"
)

var Validate = validator.New()

func generateMsgForField(fe validator.FieldError, v interface{}) (string, string) {
	t := reflect.TypeOf(v)

	field, _ := t.FieldByName(fe.StructField())

	jsonTag := field.Tag.Get("json")

	switch fe.Tag() {
	case "required":
		return jsonTag, fmt.Sprintf("`%s` is required", jsonTag)
	case "email":
		return jsonTag, fmt.Sprintf("`%s` must be a valid email address", jsonTag)
	case "min":
		return jsonTag, fmt.Sprintf(
			"`%s` should contain at least %s characters",
			jsonTag,
			fe.Param(),
		)
	case "max":
		return jsonTag, fmt.Sprintf(
			"`%s` should contain at most %s characters",
			jsonTag,
			fe.Param(),
		)
	case "dive":
		return jsonTag, fmt.Sprintf("`%s` should be in an array", jsonTag)
	case "oneof":
		return jsonTag, fmt.Sprintf("`%s` should be one of [%s]", jsonTag, fe.Param())
	case "alphanum":
		return jsonTag, fmt.Sprintf("`%s` should be alpha numerical", jsonTag)
	case "lowercase":
		return jsonTag, fmt.Sprintf("`%s` should be all lower case", jsonTag)
	case "uuid":
		return jsonTag, fmt.Sprintf("`%s` should be a valid UUID", jsonTag)
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
