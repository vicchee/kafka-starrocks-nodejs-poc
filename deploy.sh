#!/bin/sh
set -e


# npm run deploy

# 1. Rebuild containers
docker compose down
docker compose pull
docker compose build node-app
docker compose up -d

# 2. Initialize StarRocks DB if needed
# docker cp ./init.sql starrocks:/tmp/init.sql

# docker exec -it starrocks \
# mysql -P 9030 -h 127.0.0.1 -u root --prompt="StarRocks > "

# SOURCE /tmp/init.sql

# 3. Ensure Kafka topic exists
# docker exec kafka \
#     kafka-topics --create \
#     --topic get-wagers-topic \
#     --bootstrap-server localhost:9092 \
#     --if-not-exists \
#     --partitions 1 --replication-factor 1

docker logs -f node-cron-kafka
# tmux new-session -d -s mysession "docker logs -f node-cron-kafka"

# tmux split-window -h "docker exec -it kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic get-wagers-topic --from-beginning"

# tmux attach -t mysession