### save-state (WIP)

Abstraction for data store with In-Memory cache, MongoDB, Redis and Elastic without worrying about the internal implementations


[![Build Status](https://travis-ci.com/adithyasathu/save-state.svg?branch=master)](https://travis-ci.com/adithyasathu/save-state)
[![codecov](https://codecov.io/gh/adithyasathu/save-state/branch/master/graph/badge.svg)](https://codecov.io/gh/adithyasathu/save-state)











#### Local setup using Docker:

Prerequisite - Install Docker

- Mac: https://docs.docker.com/docker-for-mac/install/  
- Windows: https://docs.docker.com/docker-for-windows/

Run `docker -v` to confirm docker is running

`docker-compose up` to start all the docker images required for setup

##### Docker images defined in compose file

- **mongodb** - local DB instance Running on mongodb://localhost:27017

- **mongo-express** - Web based MongoDB admin interface running on http://localhost:9005/ 
```
user id: admin
password: password
```

`docker ps -a` should show something like below
```
adithya.sathu$ docker ps -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                      NAMES
d5c090888ef0        mongo-express       "tini -- /docker-ent…"   29 hours ago        Up 29 hours         0.0.0.0:9005->8081/tcp     save-state_mongodb-ui_1
85683df259ba        mongo:4             "docker-entrypoint.s…"   29 hours ago        Up 29 hours         0.0.0.0:27017->27017/tcp   mongodb
```

`docker logs <CONTAINER ID>` would show docker logs of that container
