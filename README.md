# Aplikasi Belajar Microservices

Contoh aplikasi pemesanan sederhana dengan tiga service NestJS dan UI Svelte.
Setiap domain service memiliki database PostgreSQL sendiri; Order Service
mengambil data produk melalui HTTP dan menyimpan snapshot nama serta harga
produk saat pesanan dibuat.

## Struktur

- `apps/gateway` — API Gateway, port `3000`.
- `apps/products` — Product Service, port `3001`, database `products_db`.
- `apps/orders` — Order Service, port `3002`, database `orders_db`.
- `apps/web` — UI Svelte + Vite, port `5173`.

Gateway meneruskan permintaan web ke domain services. Order Service berkomunikasi
langsung dengan Product Service untuk memvalidasi produk.

## Konfigurasi lokal

1. Gunakan Node.js 20 atau lebih baru dan PostgreSQL.
2. Buat database `products_db` dan `orders_db`. Buat juga `products_test_db`
   dan `orders_test_db` jika ingin menjalankan integration test. Dua database
   `*_test_db` harus disposable karena test menghapus dan membuat ulang tabel.
3. Salin tiap `.env.example` menjadi `.env` pada folder aplikasi yang sama.
   Sesuaikan kredensial PostgreSQL bila perlu.
4. Install dependency secara terpisah di tiap aplikasi, misalnya:
   `npm install --prefix apps/products`, lalu ulangi untuk `apps/orders`,
   `apps/gateway`, dan `apps/web`.
5. Jalankan service di terminal masing-masing:
   `npm --prefix apps/products run start:dev`,
   `npm --prefix apps/orders run start:dev`, dan
   `npm --prefix apps/gateway run start:dev`.
6. Jalankan UI dengan `npm --prefix apps/web run dev`, lalu buka
   `http://localhost:5173`.

TypeORM membuat tabel otomatis di environment non-production agar alur belajar
lebih ringkas. Untuk deployment production, tambahkan migration sebelum
mengaktifkan `NODE_ENV=production`.

## Menjalankan dengan Docker Compose

Compose menjalankan satu server PostgreSQL dan seluruh aplikasi di container.
Product Service dan Order Service menggunakan database terpisah pada server
tersebut; database tidak dibuat otomatis. Salin
`.env.docker.example` menjadi `.env` di root proyek, lalu sesuaikan nilainya
bila perlu. Nilai password bawaan hanya untuk belajar lokal; ganti sebelum
digunakan di lingkungan lain.

```sh
docker compose up -d postgres
docker compose exec postgres psql -U postgres -d postgres -c "CREATE DATABASE products_db;"
docker compose exec postgres psql -U postgres -d postgres -c "CREATE DATABASE orders_db;"
docker compose up --build
```

Setelah container siap, buka `http://localhost:5173`. API Gateway tersedia di
`http://localhost:3000/api`. Langkah pertama menjalankan PostgreSQL saja agar
kamu dapat membuat database secara manual sebelum aplikasi dimulai. Untuk
menjalankan integration test, buat database `products_test_db` dan
`orders_test_db` dengan cara yang sama.

Dua database tambahan (`products_test_db` dan `orders_test_db`) disediakan
untuk integration test. Contoh menjalankan test dari container:

```sh
docker compose run --rm -e NODE_ENV=test products npm run test:e2e
docker compose run --rm -e NODE_ENV=test orders npm run test:e2e
```

Compose memetakan port PostgreSQL, kedua service domain, Gateway, dan UI ke
host. Jika port lokal sudah digunakan, ubah port terkait di `.env`. Data
PostgreSQL tersimpan pada volume `postgres_data` dan bertahan setelah
container dihentikan.
Setiap aplikasi memiliki `Dockerfile`, `package.json`, dan konfigurasi test
sendiri. Compose memakai folder aplikasi tersebut sebagai build context, jadi
aplikasi dapat dibangun dan dikelola tanpa npm workspace di root. Dockerfile
saat ini untuk mode development; siapkan image multi-stage dan migration
sebelum memakai konfigurasi ini untuk deployment production.

## API

Semua endpoint web menggunakan Gateway pada prefix `/api`:

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` — body: `{ "name": "Teh", "description": "...", "price": 2.5 }`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders` — body: `{ "productId": "<uuid>", "quantity": 2 }`

Product Service memiliki endpoint yang sama di `/products`; Order Service
memiliki endpoint di `/orders`.

Health check setiap service:

- API Gateway: `GET /api/health` (contoh: `http://localhost:3000/api/health`)
- Product Service: `GET /health` (contoh: `http://localhost:3001/health`)
- Order Service: `GET /health` (contoh: `http://localhost:3002/health`)

Docker Compose menggunakan endpoint tersebut untuk memeriksa kesehatan
container aplikasi.

## Testing

Unit test:

- `npm --prefix apps/gateway test`
- `npm --prefix apps/products test`
- `npm --prefix apps/orders test`

Integration test membutuhkan PostgreSQL dan `TEST_DATABASE_URL` yang menunjuk
ke database disposable:

- `npm --prefix apps/gateway run test:e2e`
- `npm --prefix apps/products run test:e2e`
- `npm --prefix apps/orders run test:e2e`

Integration test gateway memakai mock downstream. Test Product dan Order
menjalankan HTTP app dengan database PostgreSQL; test Order memakai HTTP stub
untuk Product Service.
