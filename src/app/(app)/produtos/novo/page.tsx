import { ProductForm } from '@/components/ProductForm';
import { PageHeader } from '@/components/PageHeader';

export default function NovoProdutoPage() {
  return (
    <div>
      <PageHeader title="Novo produto" back="/produtos" />
      <ProductForm />
    </div>
  );
}
