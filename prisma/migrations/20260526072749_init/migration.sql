-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSubscription" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "billingStatus" TEXT NOT NULL DEFAULT 'active',
    "email" TEXT,
    "ownerName" TEXT,
    "shopName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateUsage" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreSubscription_shop_key" ON "StoreSubscription"("shop");
