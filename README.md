# Fine Exchange AOM: load balancer

Part of **Fine Exchange AOM**, an automated order manager for market makers that I built for my company, Fine Exchange Ltd, in 2022. The [client repository](https://github.com/VitalJeevanjot/Fine-Exchange-AMM) explains the whole system, with a diagram and the path a task takes through the services.

> **Status: shut down.** Fine Exchange closed in 2022 and the fine.exchange domain has expired, so it's no longer mine. Read the code, but don't run it with real API keys.

The API the client calls. It checks who the trader is, enforces limits, and decides which queue server runs each new task.

- `/encrypt_login` checks the trader's exchange API key with a signed request to the exchange's `/v2/user` endpoint, then returns the key and secret encrypted with cryptr.
- `/create_new` asks the database service for the trader's tasks, refuses a sixth one, and sends the task to the next queue server in turn (round robin across `MAX_SERVERS`).
- `/my_services` and `/delete_service` pass through to the database service after the same checks.
- Every request carries the first 15 characters of the trader's API key, which the services use to tag their log lines.

## Endpoints

| Route | Does |
| --- | --- |
| `POST /encrypt_login` | Verify an exchange API key and return it encrypted |
| `POST /create_new` | Create a task on the next queue server |
| `POST /stop_service` | Stop a task (same handler as `/create_new`) |
| `POST /my_services` | The trader's tasks |
| `POST /delete_service` | Delete a task |
| `GET /hello` | Health check |

## Environment

```
APIKEY=
APISECRET=
APIURL=
USER_NAME=
USER_PASSWORD=
DB_URL=
DB_PORT=
DB_NAME=
DB_TABLE_NAME=
SERVER_DB_URL=           # database service
SERVER_DB_PORT=
CREATE_NEW_ENDPOINT=
GET_SERVICES_ENDPOINT=
MAX_SERVERS=             # number of queue servers
SERVER_ONE_URL=
SERVER_ONE_PORT=
SERVER_TWO_URL=
SERVER_TWO_PORT=
ENCRYPT_KEY=             # cryptr key shared by the services
```

## The system

| Service | Repository |
| --- | --- |
| Client | [Fine-Exchange-AMM](https://github.com/VitalJeevanjot/Fine-Exchange-AMM) |
| Load balancer (the API the client calls) | [fine-ex-amm-backend-load-balancer](https://github.com/VitalJeevanjot/fine-ex-amm-backend-load-balancer) |
| Queue service | [fine-ex-amm-backend-queue-jobs-1](https://github.com/VitalJeevanjot/fine-ex-amm-backend-queue-jobs-1) |
| Worker | [fine-ex-amm-backend-worker-jobs-1](https://github.com/VitalJeevanjot/fine-ex-amm-backend-worker-jobs-1) |
| Database service | [fine-ex-amm-backend](https://github.com/VitalJeevanjot/fine-ex-amm-backend) |

## Running it

```bash
npm install
npm run dev      # nodemon on app.ts
npm run build    # compile to dist/
npm start        # node dist/app.js
```

Each service listens on port 8080. `okteto.yml` and `dockerfile` are the Okteto development environment it ran in.

Built by [Jeevanjot Singh Vital](https://jeevanjotsinghvital.com).
