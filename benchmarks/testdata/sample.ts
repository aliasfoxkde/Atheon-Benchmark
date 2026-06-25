/**
 * Sample TypeScript file for testing pattern detection
 */

const API_KEY = "AKIAIOSFODNN7EXAMPLE";
const STRIPE_KEY = "sk_live_51HdY8eZvKYlo2Cw3jHGmXj";
const GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

interface Config {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

const config: Config = {
  database: {
    host: "localhost",
    port: 5432,
    username: "admin",
    password: "secretpassword123",
  },
  aws: {
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  },
};

async function fetchData(apiKey: string): Promise<void> {
  const response = await fetch("https://api.example.com/data", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "X-API-Key": API_KEY,
    },
  });
  console.log("Data fetched successfully");
}

export async function processData(): Promise<void> {
  await fetchData(API_KEY);
  console.log("Processing complete");
}
