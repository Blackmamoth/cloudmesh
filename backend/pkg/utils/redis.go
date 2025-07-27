package utils

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/db"
)

func BuildSearchCacheKey(provider, accountID, searchText string) string {
	h := sha256.New()
	h.Write([]byte(searchText))
	hash := hex.EncodeToString(h.Sum(nil))[:10]

	return fmt.Sprintf("search_cache:%s:%s:%s", provider, accountID, hash)
}

func CacheProviderFileIDs(ctx context.Context, key string, values []string, ttl time.Duration) error {
	data, err := json.Marshal(values)
	if err != nil {
		return err
	}

	return db.RedisClient.Set(ctx, key, data, ttl).Err()
}

func GetCachedProviderFileIDs(ctx context.Context, key string) ([]string, error) {
	val, err := db.RedisClient.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var result []string
	err = json.Unmarshal([]byte(val), &result)

	return result, err
}

func DeleteKeysByPattern(ctx context.Context, pattern string) error {
	var cursor uint64
	for {
		var keys []string
		var err error

		keys, cursor, err = db.RedisClient.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return err
		}

		if len(keys) > 0 {
			if err := db.RedisClient.Del(ctx, keys...).Err(); err != nil {
				return err
			}
		}

		if cursor == 0 {
			break
		}
	}
	return nil
}
