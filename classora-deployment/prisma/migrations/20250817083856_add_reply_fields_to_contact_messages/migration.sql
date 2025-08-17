-- AlterTable
ALTER TABLE "contact_messages" ADD COLUMN "repliedAt" DATETIME;
ALTER TABLE "contact_messages" ADD COLUMN "repliedBy" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN "replyMessage" TEXT;
