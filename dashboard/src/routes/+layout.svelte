<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import '../app.css';

  let { children } = $props();
  let menuOpen = $state(false);

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/records', label: 'Records' },
    { href: '/employees', label: 'Employees' },
  ];

  function isActive(href: string, path: string) {
    if (href === '/') return path === '/';
    return path === href || path.startsWith(`${href}/`);
  }

  function closeMenu() {
    menuOpen = false;
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  afterNavigate(closeMenu);

  $effect(() => {
    document.body.classList.toggle('nav-open', menuOpen);
    return () => document.body.classList.remove('nav-open');
  });

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeMenu();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
  <title>Employee Compliance Tracking</title>
</svelte:head>

<div class="app-shell">
  <header class="mobile-bar">
    <button
      class="menu-toggle"
      type="button"
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={menuOpen}
      aria-controls="app-sidebar"
      onclick={toggleMenu}
    >
      {#if menuOpen}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7h14M5 12h14M5 17h14" />
        </svg>
      {/if}
    </button>
    <div class="brand">
      <div class="brand-mark">ABC</div>
      <div>
        <strong>ABC Company</strong>
        <span>Compliance desk</span>
      </div>
    </div>
  </header>

  {#if menuOpen}
    <button class="nav-backdrop" type="button" aria-label="Close menu" onclick={closeMenu}></button>
  {/if}

  <aside id="app-sidebar" class="sidebar" class:open={menuOpen}>
    <div class="sidebar-head">
      <div class="brand">
        <div class="brand-mark">ABC</div>
        <div>
          <strong>ABC Company</strong>
          <span>Compliance desk</span>
        </div>
      </div>
      <button class="sidebar-close" type="button" aria-label="Close menu" onclick={closeMenu}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
    <nav>
      {#each links as link}
        <a href={link.href} class:active={isActive(link.href, $page.url.pathname)}>{link.label}</a>
      {/each}
    </nav>
    <p class="sidebar-note">
      Live view of visas, certifications, background checks, and training renewals.
    </p>
  </aside>
  <main class="content">
    {@render children()}
  </main>
</div>
