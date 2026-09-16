# 🎟️ Event Seating & Check-In System

A full-stack web application for managing event seating assignments, generating dynamic QR code tickets for guests, and facilitating fast check-ins using QR scanners.

---

## 🚀 Features

- **Guest Management:** Organizers can register guests, assign tables/seats, and manage seating charts.
- **Dynamic QR Code Generation:** Automatically generates a unique QR code for every registered guest (embeddable in badges or printable tickets).
- **Public Venue QR Lookup:** A master QR code at the entrance allowing guests to search their names and view assigned seating.
- **Instant Check-in:** Ushers scan guest QR codes to instantly confirm seating details and update attendance status in real time.
- **Relational Integrity:** Prevents double-booking or assigning multiple guests to the same seat.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Node.js, Express / Next.js API Routes
- **Database:** PostgreSQL (with Prisma ORM)
- **QR Utilities:** `qrcode` (Generation) & `html5-qrcode` (Scanning)

---

## 🗄️ Database Schema

```sql
Events (id, name, event_date)
  └── Seats (id, event_id, table_number, seat_number)
        └── Guests (id, event_id, seat_id, full_name, qr_token, is_checked_in)