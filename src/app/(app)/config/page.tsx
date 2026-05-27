import Link from 'next/link';
import { Building2, Layers, Percent, Sliders, FileStack, Users } from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';

const sections = [
  { href: '/config/empresa', label: 'Dados da empresa', desc: 'Razão social, CNPJ, endereço, contato', icon: Building2 },
  { href: '/config/familias', label: 'Famílias de produto', desc: 'Linhas e categorias', icon: Layers },
  { href: '/config/impostos', label: 'Regras de imposto', desc: 'ICMS, PIS, COFINS, IPI', icon: Percent },
  { href: '/config/regras-familia', label: 'Regras por família', desc: 'Desconto máximo e margem mínima', icon: Sliders },
  { href: '/config/templates', label: 'Templates', desc: 'Modelos de orçamento e pedido', icon: FileStack },
  { href: '/config/usuarios', label: 'Usuários', desc: 'Equipe e permissões', icon: Users },
];

export default function ConfigPage() {
  return (
    <div>
      <PageHeader title="Configurações" />
      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card className="flex items-center gap-3 hover:shadow-soft">
                <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Icon className="h-6 w-6" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-text">{s.label}</div>
                  <div className="text-sm text-muted">{s.desc}</div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
