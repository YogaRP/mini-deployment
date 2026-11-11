<script lang="ts">
  interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    active: boolean;
  }

  interface Order {
    id: string;
    productName: string;
    unitPrice: string;
    quantity: number;
    total: string;
    createdAt: string;
  }

  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  let products: Product[] = $state([]);
  let orders: Order[] = $state([]);
  let name = $state("");
  let description = $state("");
  let price = $state("");
  let selectedProductId = $state("");
  let quantity = $state(1);
  let loading = $state(false);
  let error = $state("");
  let notice = $state("");

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.message ?? `Permintaan gagal (${response.status})`);
    }
    return body as T;
  }

  async function refresh() {
    loading = true;
    error = "";
    try {
      [products, orders] = await Promise.all([
        api<Product[]>("/products"),
        api<Order[]>("/orders"),
      ]);
      if (!selectedProductId && products.length > 0) {
        selectedProductId = products[0].id;
      }
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Terjadi kesalahan";
    } finally {
      loading = false;
    }
  }

  async function createProduct(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    notice = "";
    try {
      await api<Product>("/products", {
        method: "POST",
        body: JSON.stringify({ name, description, price: Number(price) }),
      });
      name = "";
      description = "";
      price = "";
      notice = "Produk berhasil ditambahkan.";
      await refresh();
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Terjadi kesalahan";
    }
  }

  async function createOrder(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    notice = "";
    try {
      await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: Number(quantity),
        }),
      });
      notice = "Pesanan berhasil dibuat.";
      await refresh();
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Terjadi kesalahan";
    }
  }

  function formatPrice(value: string) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  $effect(() => {
    void refresh();
  });
</script>

<svelte:head>
  <title>Belajar Microservices | Katalog & Pesanan</title>
  <meta
    name="description"
    content="Contoh aplikasi sederhana untuk belajar arsitektur microservices."
  />
</svelte:head>

<main class="page">
  <header class="hero">
    <div>
      <p class="eyebrow">NESTJS · SVELTE · POSTGRESQL</p>
      <h1>Katalog & Pesanan</h1>
      <p class="subtitle">Contoh kecil alur komunikasi antar-service.</p>
    </div>
    <button class="secondary" onclick={refresh} disabled={loading}>
      {loading ? "Memuat..." : "Muat ulang"}
    </button>
  </header>

  {#if error}
    <div class="message error" role="alert">{error}</div>
  {/if}
  {#if notice}
    <div class="message success" role="status">{notice}</div>
  {/if}

  <section class="layout">
    <div class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">PRODUCT SERVICE</p>
          <h2>Produk</h2>
        </div>
        <span class="count">{products.length}</span>
      </div>

      <form class="stack" onsubmit={createProduct}>
        <label>
          Nama produk
          <input bind:value={name} required minlength="1" maxlength="120" />
        </label>
        <label>
          Deskripsi
          <textarea bind:value={description} rows="2"></textarea>
        </label>
        <label>
          Harga
          <input
            bind:value={price}
            type="number"
            min="0.01"
            step="0.01"
            required
          />
        </label>
        <button type="submit">Tambah produk</button>
      </form>

      <div class="list">
        {#each products as product (product.id)}
          <article class="list-row">
            <div>
              <strong>{product.name}</strong>
              <p>{product.description || "Tanpa deskripsi"}</p>
            </div>
            <span class="price">{formatPrice(product.price)}</span>
          </article>
        {:else}
          <p class="empty">Belum ada produk. Tambahkan produk pertama.</p>
        {/each}
      </div>
    </div>

    <div class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">ORDER SERVICE</p>
          <h2>Buat pesanan</h2>
        </div>
      </div>

      <form class="stack order-form" onsubmit={createOrder}>
        <label>
          Produk
          <select
            bind:value={selectedProductId}
            required
            disabled={!products.length}
          >
            {#each products as product (product.id)}
              <option value={product.id}>
                {product.name} — {formatPrice(product.price)}
              </option>
            {/each}
          </select>
        </label>
        <label>
          Jumlah
          <input
            bind:value={quantity}
            type="number"
            min="1"
            step="1"
            required
          />
        </label>
        <button type="submit" disabled={!products.length}>Buat pesanan</button>
      </form>

      <div class="section-heading order-heading">
        <div>
          <p class="eyebrow">ORDER SERVICE</p>
          <h2>Pesanan terbaru</h2>
        </div>
        <span class="count">{orders.length}</span>
      </div>
      <div class="list">
        {#each orders as order (order.id)}
          <article class="list-row">
            <div>
              <strong>{order.productName} × {order.quantity}</strong>
              <p>{new Date(order.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <span class="price">{formatPrice(order.total)}</span>
          </article>
        {:else}
          <p class="empty">Belum ada pesanan.</p>
        {/each}
      </div>
    </div>
  </section>

  <footer>
    UI Svelte → API Gateway → Product / Order Service → PostgreSQL
  </footer>
</main>
