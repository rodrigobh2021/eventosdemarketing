const DEFAULT_SUBTITLE = 'Receba alertas quando novos eventos do seu interesse forem cadastrados.';

type Props = {
  subtitle?: string;
  variant?: 'gradient' | 'light';
};

export default function NewsletterSignup({ subtitle = DEFAULT_SUBTITLE, variant = 'gradient' }: Props) {
  const isLight = variant === 'light';

  return (
    <section className={`px-4 py-14 text-center sm:py-20 ${isLight ? 'bg-bg-alt' : 'bg-gradient-to-br from-primary to-primary/80'}`}>
      <div className="mx-auto max-w-2xl">
        <h2 className={`text-2xl font-bold sm:text-3xl ${isLight ? 'text-text' : 'text-white'}`}>
          Não perca nenhum evento
        </h2>
        <p className={`mt-3 ${isLight ? 'text-text-secondary' : 'text-blue-100'}`}>{subtitle}</p>

        <div className={`mx-auto mt-8 flex max-w-md overflow-hidden rounded-[var(--radius-card)] bg-white ${isLight ? 'border border-gray-200 shadow-sm' : 'shadow-md'}`}>
          <input
            type="email"
            placeholder="seu@email.com"
            className="flex-1 px-4 py-3.5 text-sm text-text placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="button"
            className="bg-accent px-6 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-accent/90"
          >
            Quero receber
          </button>
        </div>
      </div>
    </section>
  );
}
