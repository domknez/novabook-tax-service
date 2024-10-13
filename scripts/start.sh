version: '3.8'

services:
  db:
    image: postgres:13
    restart: always
    environment:
      POSTGRES_USER: novabook_user
      POSTGRES_PASSWORD: novabook_pass
      POSTGRES_DB: novabook_db
    ports:
      - '5432:5432'
    volumes:
      - ./db/volume:/var/lib/postgresql/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    command: ./entrypoint.sh
    volumes:
      - .:/usr/src/app
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USERNAME=novabook_user
      - DB_PASSWORD=novabook_pass
      - DB_DATABASE=novabook_db
    depends_on:
      - db

volumes:
  db_data:
