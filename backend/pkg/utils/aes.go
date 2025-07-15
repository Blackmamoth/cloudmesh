package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"

	"github.com/blackmamoth/cloudmesh/pkg/config"
)

func GetAESKey() ([]byte, error) {
	keyHex := config.AESConfig.MASTER_KEY

	key, err := hex.DecodeString(keyHex)

	if err != nil {
		return nil, fmt.Errorf("invalid hex string: %v", err)
	}

	if len(key) != 32 {
		return nil, fmt.Errorf("aes master key must be 32 bytes (64 hex characters) for AES-256")
	}

	return key, nil
}

func Encrypt(plainText string) (string, error) {

	plainTextByte := []byte(plainText)

	key, err := GetAESKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	cipherText := aesGCM.Seal(nil, nonce, plainTextByte, nil)
	cipherText = append(nonce, cipherText...)

	hexString := hex.EncodeToString(cipherText)

	return hexString, nil
}

func Decrypt(encryptedText string) (string, error) {
	key, err := GetAESKey()
	if err != nil {
		return "", err
	}

	decodedHex, err := hex.DecodeString(encryptedText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(encryptedText) < nonceSize {
		return "", fmt.Errorf("cipherText too short")
	}

	nonce, cipherText := decodedHex[:nonceSize], decodedHex[nonceSize:]
	decrypted, err := aesGCM.Open(nil, nonce, cipherText, nil)
	if err != nil {
		return "", err
	}

	return string(decrypted), nil
}
