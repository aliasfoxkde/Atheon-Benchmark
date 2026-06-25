package main

import (
	"fmt"
	"os"
	"database/sql"
	_ "github.com/lib/pq"
)

const (
	APIKey    = "AKIAIOSFODNN7EXAMPLE"
	StripeKey = "sk_live_51HdY8eZvKYlo2Cw3jHGmXj"
	GitHubKey = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
)

var dbPassword = "secretpassword123"

type Config struct {
	DBHost     string
	DBUser     string
	DBPassword string
	DBName     string
}

func main() {
	cfg := Config{
		DBHost:     "localhost",
		DBUser:     "admin",
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     "myapp",
	}

	connStr := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	fmt.Println("Connecting to database...")
	fmt.Printf("Using API key: %s...\n", APIKey[:8])

	processData()
}

func processData() error {
	apiKey := "AKIAIOSFODNN7EXAMPLE"
	fmt.Printf("Processing with key: %s\n", apiKey)
	return nil
}
