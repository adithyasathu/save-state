#### Local setup using Docker:

Prerequisite - Install Docker

- Mac: https://docs.docker.com/docker-for-mac/install/  
- Windows: https://docs.docker.com/docker-for-windows/

Run `docker -v` to confirm docker is running

`docker-compose up` to start all the docker images required for setup

##### Docker images defined in compose file

- **mongodb** - Mongo DB instance Running on mongodb://localhost:27017

- **mongo-express** - Web based MongoDB admin interface running on http://localhost:9005/ 

```
user id: admin
password: password
```

- **redis** - RedisDB instance Running on redis://localhost:6379/0

- **redis-commander** - Web based Redis admin interface running on http://localhost:8081/

- **elastic** - Elasticsearch instance running on http://localhost:9200


`docker ps -a` list of docker containers and status
```
adithya.sathu$ docker ps -a
CONTAINER ID        IMAGE                                   COMMAND                  CREATED             STATUS                 PORTS                              NAMES
ad4795e13f68        elasticsearch:7.6.2                     "/usr/local/bin/dock…"   About an hour ago   Up About an hour       0.0.0.0:9200->9200/tcp, 9300/tcp   save-state_elastic_1
65494191b3dd        rediscommander/redis-commander:latest   "/usr/bin/dumb-init …"   5 days ago          Up 2 hours (healthy)   0.0.0.0:8081->8081/tcp             redis-commander
428c7853d67d        redis:4                                 "docker-entrypoint.s…"   5 days ago          Up 2 hours             0.0.0.0:6379->6379/tcp             save-state_redis_1
d5c090888ef0        mongo-express                           "tini -- /docker-ent…"   8 days ago          Up 2 hours             0.0.0.0:9005->8081/tcp             save-state_mongodb-ui_1
85683df259ba        mongo:4                                 "docker-entrypoint.s…"   8 days ago          Up 2 hours             0.0.0.0:27017->27017/tcp           mongodb
```

`docker logs <CONTAINER ID>` docker logs of the container

`docker start <CONTAINER ID>` start container

`docker restart <CONTAINER ID>` restart container

`docker stop <CONTAINER ID>` stop container

`docker rm <CONTAINER ID>` remove container, obviously you have to stop it first

`docker images` list of images installed

```
adithya.sathu$ docker images
REPOSITORY                       TAG                 IMAGE ID            CREATED             SIZE
redis                            4                   f54239c50400        9 days ago          89.2MB
mongo                            4                   c5e5843d9f5f        13 days ago         387MB
elasticsearch                    7.6.2               f29a1ee41030        2 weeks ago         791MB
mongo-express                    latest              a36d72e09c39        2 weeks ago         127MB
rediscommander/redis-commander   latest              abbafbd36f62        3 weeks ago         107MB
```

`docker rmi <IMAGE ID>` remove image, again you have to stop and remove the container first

**Dont forget ` docker -help` would show all the options available**
