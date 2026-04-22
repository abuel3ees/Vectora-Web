import { Link } from '@inertiajs/react'

const colophon = {
  'The house':  [['Features', '#features'], ['Pricing', '#'], ['API', '#'], ['Integrations', '#']],
  'Of us':      [['About', '#'], ['Journal', '#'], ['Careers', '#'], ['Correspond', '#']],
  'To consult': [['Documentation', '#'], ['Help', '#'], ['Case studies', '#'], ['Salons', '#']],
  'In record':  [['Privacy', '#'], ['Terms', '#'], ['Security', '#'], ['Compliance', '#']],
}

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-8 md:px-12 py-20">
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border border-border/80 rounded-sm">
                <span className="font-display text-xl leading-none text-foreground">V</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg tracking-tight text-foreground">Vectora</span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Maison de Flotte</span>
              </div>
            </Link>
            <p className="mt-6 max-w-xs text-sm italic font-serif text-muted-foreground leading-relaxed">
              A quiet studio for vehicle routing — where every dispatch is considered, and no mile is wasted.
            </p>
          </div>

          {Object.entries(colophon).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">{heading}</h3>
              <ul className="space-y-3">
                {links.map(([name, href]) => (
                  <li key={name}>
                    <Link href={href} className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            &copy; {new Date().getFullYear()} · Vectora · Established twenty twenty-six
          </p>
          <p className="text-xs italic font-serif text-muted-foreground">
            Set in Geist &amp; Instrument Serif. Composed with care.
          </p>
        </div>
      </div>
    </footer>
  )
}
