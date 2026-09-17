-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    CONSTRAINT "Seat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "seatId" INTEGER,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "qrToken" TEXT NOT NULL,
    "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Guest_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_eventId_tableNumber_seatNumber_key" ON "Seat"("eventId", "tableNumber", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_seatId_key" ON "Guest"("seatId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_qrToken_key" ON "Guest"("qrToken");
