import { useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Plus } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { commerceService } from '../../services/serviceFactory.js';
import { eligible } from '../../services/permissions.js';
import {
  Card,
  PageHeader,
  Button,
  LinkButton,
  Badge,
  Currency,
  Notice,
  Empty,
  Table,
  Details,
  Timeline,
  Confirm,
} from '../../components/common/UI.jsx';
import ProductArt from '../../components/common/ProductArt.jsx';
import { date } from '../../utils/format.js';
export default function Commerce() {
  const { data, cart, setCart, toast } = useApp(),
    { id } = useParams(),
    navigate = useNavigate();
  const [search, setSearch] = useState(''),
    [sizes, setSizes] = useState({});
  const valid = eligible(data.membership, data.clock),
    product = id ? data.products.find((p) => p.id === id) : null;
  const list = product
    ? [product]
    : data.products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  if (id && !product) return <Empty title="Product not found" />;
  function add(p, v) {
    if (data.stock[v.id] < 1) {
      toast('This variant is out of stock', true);
      return;
    }
    setCart((items) => {
      const current = items.find((i) => i.variantId === v.id);
      return current
        ? items.map((i) => (i.variantId === v.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...items, { variantId: v.id, quantity: 1 }];
    });
    toast(`${p.title} added to your cart`);
  }
  return (
    <div className="stack">
      <PageHeader
        title={product ? product.title : 'Wear your community.'}
        description="Campus essentials. Made for everyday moments."
      >
        <LinkButton to="/cart">
          <ShoppingBag size={16} />
          Your cart ({cart.reduce((a, i) => a + i.quantity, 0)})
        </LinkButton>
      </PageHeader>
      {!valid && (
        <Notice>
          Members save on every campus essential.{' '}
          <Link to="/membership">Explore membership benefits.</Link>
        </Notice>
      )}
      {data.membership?.status === 'GRACE_PERIOD' && (
        <Notice tone="warning">Your grace-period membership discount is still active.</Notice>
      )}
      {!product && (
        <div className="toolbar">
          <input
            className="input"
            aria-label="Search products"
            placeholder="Search the collection…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Badge>{data.products.length} campus essentials</Badge>
        </div>
      )}
      <div className={`grid ${product ? 'two' : 'three'}`}>
        {list.map((p) => {
          const variants = data.variants.filter((v) => v.productId === p.id),
            v = variants.find((v) => v.id === sizes[p.id]) || variants[0];
          return (
            <Card className="product-card" key={p.id}>
              <ProductArt kind={p.visual} />
              <div className="card-body">
                <Badge>{p.category}</Badge>
                <h3>
                  <Link to={`/store/${p.id}`}>{p.title}</Link>
                </h3>
                <p className="muted">{p.description}</p>
                {v ? (
                  <>
                    <div className="row between">
                      <h3>
                        <Currency amount={valid ? v.memberPrice : v.publicPrice} />
                      </h3>
                      <Badge
                        tone={
                          data.stock[v.id] < 1 ? 'danger' : data.stock[v.id] < 5 ? 'warning' : ''
                        }
                      >
                        {data.stock[v.id]} in stock
                      </Badge>
                    </div>
                    <p className="caption muted">
                      Member <Currency amount={v.memberPrice} /> · regular{' '}
                      <Currency amount={v.publicPrice} />
                    </p>
                    {valid && (
                      <Badge tone="info">
                        Save <Currency amount={v.publicPrice - v.memberPrice} />
                      </Badge>
                    )}
                    <div className="field">
                      <label htmlFor={`size-${p.id}`}>Size · {v.color}</label>
                      <select
                        id={`size-${p.id}`}
                        value={v.id}
                        onChange={(e) => setSizes((s) => ({ ...s, [p.id]: e.target.value }))}
                      >
                        {variants.map((v) => (
                          <option value={v.id} key={v.id}>
                            {v.size} · {data.stock[v.id]} available
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button primary disabled={data.stock[v.id] < 1} onClick={() => add(p, v)}>
                      Add to cart <Plus size={16} />
                    </Button>
                  </>
                ) : (
                  <Notice tone="warning">This product does not have available variants yet.</Notice>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {!list.length && <Empty title="No products match your search" />}
    </div>
  );
}
export function Cart() {
  const { data, cart, setCart } = useApp(),
    { run, busy } = useAction(),
    navigate = useNavigate();
  const valid = eligible(data.membership, data.clock);
  const total = cart.reduce((a, i) => {
    const v = data.variants.find((v) => v.id === i.variantId);
    return a + (v ? (valid ? v.memberPrice : v.publicPrice) * i.quantity : 0);
  }, 0);
  return (
    <div className="stack">
      <PageHeader
        title="Your campus essentials"
        description="A few good things, ready for your everyday."
      />
      {cart.length ? (
        <>
          <Card>
            <div className="card-body stack">
              {cart.map((i) => {
                const v = data.variants.find((v) => v.id === i.variantId),
                  p = data.products.find((p) => p.id === v?.productId);
                return (
                  <div className="row between" key={i.variantId}>
                    <div>
                      <h3>{p?.title}</h3>
                      <p className="caption muted">
                        {v?.size} · {v?.color}
                      </p>
                    </div>
                    <div className="row">
                      <label className="sr-only" htmlFor={`quantity-${v.id}`}>
                        Quantity for {p?.title}
                      </label>
                      <input
                        id={`quantity-${v.id}`}
                        className="input"
                        type="number"
                        min="1"
                        max={data.stock[v.id]}
                        style={{ width: 80 }}
                        value={i.quantity}
                        onChange={(e) =>
                          setCart((items) =>
                            items.map((item) =>
                              item.variantId === i.variantId
                                ? { ...item, quantity: Number(e.target.value) }
                                : item,
                            ),
                          )
                        }
                      />
                      <Currency amount={(valid ? v.memberPrice : v.publicPrice) * i.quantity} />
                      <Button
                        onClick={() =>
                          setCart((items) => items.filter((item) => item.variantId !== i.variantId))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="card-divider" />
              <div className="row between">
                <h3>Total</h3>
                <h2>
                  <Currency amount={total} />
                </h2>
              </div>
              {!valid && (
                <Notice>
                  Membership unlocks savings on this order.{' '}
                  <Link to="/membership">Explore plans</Link> before checkout.
                </Notice>
              )}
              <Button
                primary
                disabled={busy}
                onClick={async () => {
                  if (data.role === 'VISITOR') {
                    navigate('/login');
                    return;
                  }
                  const o = await run(() => commerceService.reserve(cart));
                  if (o) {
                    setCart([]);
                    navigate(`/checkout/order/${o.id}`);
                  }
                }}
              >
                Reserve items & checkout
              </Button>
            </div>
          </Card>
          <Notice>
            Your stock hold starts at checkout and lasts 10 minutes. Payment is simulated.
          </Notice>
        </>
      ) : (
        <Empty
          title="Your cart is waiting for something good."
          description="Explore the collection and find your new campus essential."
          action={
            <LinkButton primary to="/store">
              Browse merchandise
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
export function Orders() {
  const { data } = useApp(),
    { id } = useParams(),
    location = useLocation(),
    { run, busy } = useAction();
  const [confirm, setConfirm] = useState(null),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('ALL');
  const management = location.pathname.startsWith('/dashboard'),
    o = id ? data.orders.find((o) => o.id === id) : null;
  const list = (
    management ? data.orders : data.orders.filter((o) => o.userId === data.user.id)
  ).filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'ALL' || o.status === filter),
  );
  const actions = (order) => (
    <div className="row">
      {order.status === 'PENDING' && (
        <LinkButton to={`/checkout/order/${order.id}`}>Checkout</LinkButton>
      )}
      {['PENDING', 'PAID', 'PROCESSING'].includes(order.status) && (
        <Button danger disabled={busy} onClick={() => setConfirm({ kind: 'cancel', order })}>
          Cancel order
        </Button>
      )}
      {management && ['PAID', 'PROCESSING'].includes(order.status) && (
        <Button
          primary
          disabled={busy}
          onClick={() =>
            run(
              () => commerceService.fulfill(order.id),
              order.status === 'PAID' ? 'Order marked processing' : 'Order fulfilled',
            )
          }
        >
          {order.status === 'PAID' ? 'Prepare pickup' : 'Confirm pickup'}
        </Button>
      )}
      {order.status === 'FULFILLED' && !order.returnRequested && (
        <Button
          disabled={busy}
          onClick={() =>
            run(
              () => commerceService.requestReturn(order.id),
              'Return requested. An officer must inspect the item.',
            )
          }
        >
          Request return
        </Button>
      )}
      {management && order.status === 'FULFILLED' && order.returnRequested && (
        <>
          <Button disabled={busy} onClick={() => setConfirm({ kind: 'SELLABLE', order })}>
            Inspect: sellable
          </Button>
          <Button danger disabled={busy} onClick={() => setConfirm({ kind: 'DAMAGED', order })}>
            Inspect: damaged
          </Button>
        </>
      )}
    </div>
  );
  if (id && !o) return <Empty title="Order not found" />;
  return (
    <div className="stack">
      <PageHeader
        title={o ? o.id : management ? 'Orders & returns' : 'My orders'}
        description="Every campus essential, from checkout to collection."
      />
      {o ? (
        <div className="grid two">
          <Card>
            <div className="card-body stack">
              <Badge value={o.status} />
              <Details
                items={[
                  ['Order reference', <span className="mono">{o.id}</span>],
                  ['Placed on', date(o.createdAt)],
                  ['Demo total', <Currency amount={o.amount} />],
                  ['Pickup', o.pickup],
                ]}
              />
              {o.items.map((i, index) => {
                const v = data.variants.find((v) => v.id === i.variantId),
                  p = data.products.find((p) => p.id === v?.productId);
                return (
                  <div key={index} className="row between">
                    <span>
                      {p?.title} · {v?.size} × {i.quantity}
                    </span>
                    <Currency amount={i.price * i.quantity} />
                  </div>
                );
              })}
              {o.returnRequested && (
                <Notice tone="warning">
                  Return requested. Awaiting inspection;{' '}
                  {o.condition?.toLowerCase() || 'condition not yet recorded'}.
                </Notice>
              )}
              {o.refundStatus && (
                <Notice>Demo refund completed. Financial reversal recorded.</Notice>
              )}
              {actions(o)}
            </div>
          </Card>
          <Card title="Order timeline">
            <div className="card-body">
              <Timeline items={o.history} />
            </div>
          </Card>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <input
              className="input"
              aria-label="Search orders"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order reference…"
            />
            <select
              aria-label="Order status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {['ALL', 'PENDING', 'PAID', 'PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED'].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </div>
          <Table
            rows={list}
            columns={[
              {
                key: 'id',
                title: 'Order',
                render: (o) => (
                  <Link
                    className="mono"
                    to={
                      management
                        ? `/dashboard/${data.club.slug}/orders/${o.id}`
                        : `/portal/orders/${o.id}`
                    }
                  >
                    {o.id}
                  </Link>
                ),
              },
              { key: 'createdAt', title: 'Placed', render: (o) => date(o.createdAt) },
              {
                key: 'amount',
                title: 'Total',
                align: 'number',
                render: (o) => <Currency amount={o.amount} />,
              },
              { key: 'status', title: 'Status', render: (o) => <Badge value={o.status} /> },
              { key: 'actions', title: 'Next step', render: actions },
            ]}
          />
          <LinkButton to="/store">Explore merchandise</LinkButton>
        </>
      )}
      {confirm && (
        <Confirm
          title={
            confirm.kind === 'cancel'
              ? 'Cancel this order?'
              : `Refund after ${confirm.kind.toLowerCase()} inspection?`
          }
          description={
            confirm.kind === 'DAMAGED'
              ? 'The demo refund reverses revenue and records inventory loss. Damaged goods are not restocked.'
              : 'The demo refund reverses revenue and restores paid stock exactly once.'
          }
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const r = await run(
              () =>
                confirm.kind === 'cancel'
                  ? commerceService.cancel(confirm.order.id)
                  : commerceService.inspect({ orderId: confirm.order.id, condition: confirm.kind }),
              'Order and financial records updated',
            );
            if (r) setConfirm(null);
          }}
        />
      )}
    </div>
  );
}
