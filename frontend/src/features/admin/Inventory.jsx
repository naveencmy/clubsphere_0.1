import { useState } from 'react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { commerceService } from '../../services/serviceFactory.js';
import {
  PageHeader,
  Table,
  Badge,
  Button,
  Currency,
  Modal,
  Card,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
export default function Inventory() {
  const { data, toast } = useApp();
  const [search, setSearch] = useState(''),
    [edit, setEdit] = useState(null),
    [product, setProduct] = useState(null),
    [variant, setVariant] = useState(null);
  return (
    <div className="stack">
      <PageHeader
        title="Campus essentials, accounted for."
        description="Variants, stock holds, member prices and every inventory change."
      >
        <Button onClick={() => setVariant({ productId: data.products[0]?.id, color: 'Navy' })}>
          Add variant
        </Button>
        <Button primary onClick={() => setProduct({})}>
          Add product
        </Button>
      </PageHeader>
      <div className="toolbar">
        <input
          className="input"
          aria-label="Search inventory"
          placeholder="Search SKU, product or size…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Badge tone="warning">
          {data.variants.filter((v) => data.stock[v.id] < 5).length} low-stock variants
        </Badge>
      </div>
      <Table
        rows={data.variants.filter((v) =>
          `${v.sku} ${data.products.find((p) => p.id === v.productId)?.title}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )}
        columns={[
          {
            key: 'product',
            title: 'Product',
            render: (v) => data.products.find((p) => p.id === v.productId)?.title,
          },
          { key: 'sku', title: 'SKU', render: (v) => <span className="mono">{v.sku}</span> },
          { key: 'size', title: 'Size' },
          {
            key: 'stock',
            title: 'Available / reserved',
            render: (v) => (
              <div>
                <Badge
                  tone={data.stock[v.id] < 1 ? 'danger' : data.stock[v.id] < 5 ? 'warning' : ''}
                >
                  {data.stock[v.id]} available
                </Badge>
                <p className="caption muted">{v.stock - data.stock[v.id]} reserved</p>
              </div>
            ),
          },
          {
            key: 'memberPrice',
            title: 'Member price',
            align: 'number',
            render: (v) => <Currency amount={v.memberPrice} />,
          },
          {
            key: 'publicPrice',
            title: 'Public price',
            align: 'number',
            render: (v) => <Currency amount={v.publicPrice} />,
          },
          {
            key: 'action',
            title: 'Actions',
            render: (v) => (
              <div className="row">
                <Button onClick={() => setEdit(v)}>Adjust stock</Button>
                <Button onClick={() => setVariant(v)}>Edit variant</Button>
              </div>
            ),
          },
        ]}
      />
      <Card title="Product directory">
        <div className="card-body stack">
          {data.products.map((p) => (
            <div className="row between" key={p.id}>
              <div>
                <strong>{p.title}</strong>
                <p className="muted">{p.description}</p>
              </div>
              <Button onClick={() => setProduct(p)}>Edit product</Button>
            </div>
          ))}
        </div>
      </Card>
      {edit && (
        <Modal title={`Adjust stock · ${edit.sku}`} onClose={() => setEdit(null)}>
          <RecordForm
            fields={[
              {
                name: 'change',
                label: 'Stock change · positive to add, negative to remove',
                type: 'number',
                required: true,
                full: true,
              },
              {
                name: 'reason',
                label: 'Adjustment reason',
                type: 'textarea',
                required: true,
                full: true,
              },
            ]}
            onCancel={() => setEdit(null)}
            onSubmit={async (v) => {
              await commerceService.adjust({
                variantId: edit.id,
                change: Number(v.change),
                reason: v.reason,
              });
              toast('Stock adjustment recorded');
              setEdit(null);
            }}
          />
        </Modal>
      )}
      {product && (
        <Modal
          title={product.id ? 'Edit product' : 'Create product'}
          onClose={() => setProduct(null)}
        >
          <RecordForm
            fields={[
              { name: 'title', label: 'Product name', required: true, full: true },
              {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                required: true,
                full: true,
              },
              { name: 'category', label: 'Category', options: ['Apparel', 'Accessories'] },
              { name: 'visual', label: 'Product illustration', options: ['hoodie', 'tee', 'tote'] },
            ]}
            initial={product}
            onCancel={() => setProduct(null)}
            onSubmit={async (v) => {
              await commerceService.saveProduct({ ...v, id: product.id });
              toast('Product saved');
              setProduct(null);
            }}
          />
        </Modal>
      )}
      {variant && (
        <Modal
          title={variant.id ? 'Edit product variant' : 'Create product variant'}
          onClose={() => setVariant(null)}
        >
          <RecordForm
            fields={[
              {
                name: 'productId',
                label: 'Product',
                required: true,
                options: data.products.map((p) => ({ value: p.id, label: p.title })),
              },
              { name: 'sku', label: 'Unique SKU', required: true },
              {
                name: 'size',
                label: 'Size',
                required: true,
                options: ['S', 'M', 'L', 'XL', 'XXL', 'One size'],
              },
              { name: 'color', label: 'Color', required: true },
              { name: 'stock', label: 'Total stock', type: 'number', required: true },
              { name: 'cost', label: 'Unit cost (₹)', type: 'number', step: '.01', required: true },
              {
                name: 'memberPrice',
                label: 'Member price (₹)',
                type: 'number',
                step: '.01',
                required: true,
              },
              {
                name: 'publicPrice',
                label: 'Public price (₹)',
                type: 'number',
                step: '.01',
                required: true,
              },
            ]}
            initial={{
              ...variant,
              memberPrice: (variant.memberPrice || 0) / 100,
              publicPrice: (variant.publicPrice || 0) / 100,
              cost: (variant.cost || 0) / 100,
            }}
            onCancel={() => setVariant(null)}
            onSubmit={async (v) => {
              await commerceService.saveVariant({
                ...v,
                id: variant.id,
                stock: Number(v.stock),
                cost: Math.round(Number(v.cost) * 100),
                memberPrice: Math.round(Number(v.memberPrice) * 100),
                publicPrice: Math.round(Number(v.publicPrice) * 100),
              });
              toast('Variant saved');
              setVariant(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
