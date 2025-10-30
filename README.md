# StarRocks + Kafka + Node.js Deployment Guide

This guide sets up a pipeline where Node.js sends wager events to Kafka, which are ingested into StarRocks via Kafka Routine Load.  
After setup, run `npm run deploy` to build and restart the app.

---
## Prerequisites

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and ensure it is running.
- Install [Node.js](https://nodejs.org/) (v16+ recommended).
- Install [npm](https://www.npmjs.com/get-npm) if not included with Node.js.
---

## Environment Variables

Create a `.env` file in your project root:

```bash
# Node.js
NODE_ENV=development
PORT=8089
LOG_LEVEL=debug   # 'info' | 'warn'

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=app-producer
KAFKA_WAGERS_TOPIC=get-wagers-topic

# StarRocks
STARROCKS_HOST=starrocks
STARROCKS_PORT=9030
STARROCKS_USER=root
STARROCKS_PASSWORD=
STARROCKS_DB=starrocks

# Cron
ENABLE_CRON=1
ENABLE_WAGERS_CRON=1
WAGERS_CRON=* * * * *

```
---

## Setup and Deployment

```bash
# 1. Install dependencies
npm install

# 2. Pull latest images
docker-compose pull

# 3. Build and start containers
docker-compose build node-app
docker-compose up -d

# 4. Create network (if not exists)
docker network inspect kafka-starrocks-net || docker network create kafka-starrocks-net

# 5. Connect containers to network
docker network connect kafka-starrocks-net starrocks
docker network connect kafka-starrocks-net node-app
docker network connect kafka-starrocks-net kafka

# 6. Access Kafka container
docker exec -it kafka sh

# 7. Create or recreate topic
kafka-topics --bootstrap-server localhost:9092 --delete --topic get-wagers-topic
kafka-topics --bootstrap-server localhost:9092 --create --topic get-wagers-topic --partitions 1 --replication-factor 1

# Optional: Read from topic for verification
kafka-console-consumer --bootstrap-server localhost:9092 --topic get-wagers-topic --from-beginning

# 8. Access StarRocks
docker exec -it starrocks mysql -P 9030 -h 127.0.0.1 -u root --prompt="StarRocks > "

# 9. Create database and table
CREATE DATABASE IF NOT EXISTS starrocks;
USE starrocks;

CREATE TABLE wagers (
  game_type VARCHAR(65533) NOT NULL,
  wager_no VARCHAR(65533) NOT NULL,
  parent_wager_no VARCHAR(65533),
  ticket_no VARCHAR(65533),
  status INT NOT NULL,
  currency VARCHAR(65533) NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  payment_amount DECIMAL(18,6),
  effective_amount DECIMAL(18,6) NOT NULL,
  profit_and_loss DECIMAL(18,6) NOT NULL,
  wager_time INT NOT NULL,
  settlement_time INT,
  event_id VARCHAR(65533),
  event_type VARCHAR(65533),
  metadata_type VARCHAR(65533),
  metadata JSON,
  is_system_reward TINYINT DEFAULT '0',
  merchant_id INT NOT NULL,
  user_id INT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
ENGINE=OLAP
UNIQUE KEY (game_type, wager_no)
DISTRIBUTED BY HASH(game_type)
PROPERTIES ("replication_num" = "1");

# 10. Create Kafka Routine Load
CREATE ROUTINE LOAD wager_load ON wagers
COLUMNS(
  game_type,
  wager_no,
  parent_wager_no,
  ticket_no,
  status,
  currency,
  amount,
  payment_amount,
  effective_amount,
  profit_and_loss,
  wager_time,
  settlement_time,
  event_id,
  event_type,
  metadata_type,
  metadata,
  is_system_reward,
  merchant_id,
  user_id,
  updated_at
)
PROPERTIES(
  "desired_concurrent_number" = "5",
  "format" = "json",
  "jsonpaths" = "[ \"$.game_type\", \"$.wager_no\", \"$.parent_wager_no\", \"$.ticket_no\", \"$.status\", \"$.currency\", \"$.amount\", \"$.payment_amount\", \"$.effective_amount\", \"$.profit_and_loss\", \"$.wager_time\", \"$.settlement_time\", \"$.event_id\", \"$.event_type\", \"$.metadata_type\", \"$.metadata\", \"$.is_system_reward\", \"$.merchant_id\", \"$.user_id\", \"$.updated_at\" ]"
)
FROM KAFKA(
  "kafka_broker_list" = "kafka:9092",
  "kafka_topic" = "get-wagers-topic",
  "kafka_partitions" = "0",
  "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);

# 11. Verify Routine Load
SHOW ROUTINE LOAD;

# 12. Deploy and restart the app
npm run deploy
```

---

## API Testing via cURL / Postman
```bash
# Example 1: Basic query (single)
curl --location 'http://localhost:8089/api/wagers/1-query?user_id=564'

# Example 2: Grouped query (with parameters)
curl --location 'http://localhost:8089/api/wagers/2-query?user_id=564&merchant_id=8&game_type=slots&group_by=month&from=2025-10-01&to=2025-10-29'

# Example 3: Daily grouping
curl --location 'http://localhost:8089/api/wagers/2-query?user_id=564&group_by=day&from=2025-10-01&to=2025-10-29'

# Example 4: Yearly grouping
curl --location 'http://localhost:8089/api/wagers/1-query?user_id=564&group_by=year&from=2020-01-01&to=2025-10-29'
```

## Connecting via MySQL Workbench

- **Hostname:** 127.0.0.1
- **Port:** 9030
- **Username:** root
- **Password:** (leave empty if not set)
