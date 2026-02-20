import Link from 'next/link';

const exploreLinks = [
  { href: '/eventos/conferencias', label: 'Conferências' },
  { href: '/eventos/workshops', label: 'Workshops' },
  { href: '/eventos/meetups', label: 'Meetups' },
  { href: '/eventos/webinars', label: 'Webinars' },
  { href: '/eventos/cursos', label: 'Cursos' },
  { href: '/eventos?formato=ONLINE', label: 'Eventos Online' },
];

const organizerLinks = [
  { href: '/cadastrar-evento', label: 'Cadastre seu Evento' },
];

const aboutLinks = [
  { href: '/politica-de-privacidade', label: 'Política de Privacidade' },
  { href: '/termos-de-uso', label: 'Termos de Uso' },
  { href: '/contato', label: 'Contato' },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-footer-bg)] text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand */}
          <div>
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight text-white">
                eventos<span className="text-[var(--color-accent)]">de</span>marketing
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Descubra os melhores eventos de marketing do Brasil. Conferências, workshops, meetups
              e mais — tudo em um só lugar.
            </p>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Explorar</h3>
            <ul className="mt-4 space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — For Organizers */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
              Para Organizadores
            </h3>
            <ul className="mt-4 space-y-2.5">
              {organizerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — About */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Sobre</h3>
            <ul className="mt-4 space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <span>&copy; {new Date().getFullYear()} eventosdemarketing.com.br</span>
          <span>
            Feito com <span className="text-red-400">&hearts;</span> para marketers
          </span>
        </div>
      </div>
    </footer>
  );
}
