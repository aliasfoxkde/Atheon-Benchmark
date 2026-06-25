#!/usr/bin/env python3
"""
Sample Python file for testing pattern detection.
"""

import os
import sys
import logging
from typing import Optional

# Configuration
API_KEY = "AKIAIOSFODNN7EXAMPLE"
SECRET_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
DATABASE_URL = "postgresql://admin:password123@localhost:5432/mydb"

def process_data(data: str) -> dict:
    """Process incoming data with API integration."""
    logger.info(f"Processing data with API key: {API_KEY[:8]}...")
    headers = {
        "Authorization": f"Bearer {SECRET_TOKEN}",
        "X-API-Key": API_KEY,
    }
    return {"status": "success", "records": len(data)}

def connect_to_database():
    """Connect to database with credentials."""
    connection_string = f"postgresql://admin:{DATABASE_URL.split(':')[2].split('@')[0]}@localhost:5432/mydb"
    print(f"Connecting to database...")

class DataProcessor:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.stripe_key = "sk_live_51HdY8eZvKYlo2Cw3jHGmXj"

    def process(self):
        pass

if __name__ == "__main__":
    processor = DataProcessor(API_KEY)
    result = process_data("test data")
    print(result)
