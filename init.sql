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
PROPERTIES (
    "replication_num" = "1"
);

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
PROPERTIES (
    "desired_concurrent_number" = "5",
    "format" = "json",
    "jsonpaths" = "[
        \"$.game_type\",
        \"$.wager_no\",
        \"$.parent_wager_no\",
        \"$.ticket_no\",
        \"$.status\",
        \"$.currency\",
        \"$.amount\",
        \"$.payment_amount\",
        \"$.effective_amount\",
        \"$.profit_and_loss\",
        \"$.wager_time\",
        \"$.settlement_time\",
        \"$.event_id\",
        \"$.event_type\",
        \"$.metadata_type\",
        \"$.metadata\",
        \"$.is_system_reward\",
        \"$.merchant_id\",
        \"$.user_id\",
        \"$.updated_at\"
    ]"
)
FROM KAFKA (
    "kafka_broker_list" = "kafka:9092",
    "kafka_topic" = "get-wagers-topic",
    "kafka_partitions" = "0",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);