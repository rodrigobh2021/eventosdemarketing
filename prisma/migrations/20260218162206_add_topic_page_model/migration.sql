-- CreateTable
CREATE TABLE "topic_pages" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_pages_topic_key" ON "topic_pages"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "topic_pages_slug_key" ON "topic_pages"("slug");
