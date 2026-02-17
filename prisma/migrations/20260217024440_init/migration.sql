-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('CONFERENCIA', 'WORKSHOP', 'MEETUP', 'WEBINAR', 'CURSO', 'PALESTRA', 'HACKATHON');

-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('PRESENCIAL', 'ONLINE', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('RASCUNHO', 'PUBLICADO', 'CANCELADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "SubmissionSource" AS ENUM ('ORGANIZADOR', 'AGENTE', 'ADMIN');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "start_time" TEXT,
    "end_time" TEXT,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "venue_name" TEXT,
    "category" "EventCategory" NOT NULL,
    "topics" TEXT[],
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "price_info" TEXT,
    "ticket_url" TEXT,
    "event_url" TEXT,
    "image_url" TEXT,
    "organizer_name" TEXT NOT NULL,
    "organizer_url" TEXT,
    "format" "EventFormat" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'RASCUNHO',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    "interest_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "cities_of_interest" TEXT[],
    "topics_of_interest" TEXT[],
    "notify_free_only" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "unsubscribe_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "auth_provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_submissions" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT,
    "event_data" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDENTE',
    "reviewer_notes" TEXT,
    "source" "SubmissionSource" NOT NULL,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_city_idx" ON "events"("city");

-- CreateIndex
CREATE INDEX "events_state_idx" ON "events"("state");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_format_idx" ON "events"("format");

-- CreateIndex
CREATE INDEX "events_is_free_idx" ON "events"("is_free");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_start_date_idx" ON "events"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_unsubscribe_token_key" ON "users"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizers_email_key" ON "organizers"("email");

-- AddForeignKey
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
