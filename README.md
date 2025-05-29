# Strange Beasts: Fight Night - Backend

This repo contains the backend components for running _Strange Beasts: Fight Night_.

This project was built when I was participating in the [Web Dev Challenge Hackathon S2.E2: Build a game played on at least 2 devices](https://codetv.dev/blog/web-dev-challenge-hackathon-s2e2-multi-device-game-temporal).

## Components

- Temporal Server

  ```shell
  npm run temporal:dev
  ```

- Temporal Worker

  ```shell
  npm run worker:dev
  ```

- BEFE Server  
  This is the Backend-for-Frontend server that the frontend UI comminucates with.

  ```shell
  npm run server:dev
  ```

## Environment Variables

A `.env` file will need to be created at the root of your local repo with the appropriate vars set. See the `.env-example.txt` for details.
