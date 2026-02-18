-- AlterTable
ALTER TABLE "events" ADD COLUMN     "meta_description" TEXT,
ADD COLUMN     "meta_title" TEXT;

-- CreateTable
CREATE TABLE "category_pages" (
    "id" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_pages" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_pages_category_key" ON "category_pages"("category");

-- CreateIndex
CREATE UNIQUE INDEX "category_pages_slug_key" ON "category_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "city_pages_slug_key" ON "city_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "city_pages_city_state_key" ON "city_pages"("city", "state");
